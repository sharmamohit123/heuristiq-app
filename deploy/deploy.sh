#!/usr/bin/env bash
# Deploys Heuristiq to Cloud Run.
#
# Usage:
#   cp deploy/.env.deploy.example deploy/.env.deploy   # fill in values
#   ./deploy/deploy.sh
#
# Idempotent: re-running rebuilds the image, rolls out a new revision, and
# refreshes secrets and the Cloud Scheduler job.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f deploy/.env.deploy ]]; then
  set -a
  # shellcheck disable=SC1091
  source deploy/.env.deploy
  set +a
fi

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${NEXT_PUBLIC_SUPABASE_URL:?Set NEXT_PUBLIC_SUPABASE_URL}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?Set NEXT_PUBLIC_SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"

REGION="${REGION:-asia-southeast1}"
SERVICE="${SERVICE:-heuristiq}"
AR_REPO="${AR_REPO:-heuristiq}"
MIN_INSTANCES="${MIN_INSTANCES:-1}"
MAX_INSTANCES="${MAX_INSTANCES:-3}"
MAX_BROWSER_CONTEXTS="${MAX_BROWSER_CONTEXTS:-12}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-3-flash-preview}"
CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 24)}"

RUN_SA_NAME="${SERVICE}-run"
RUN_SA="${RUN_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

gcloud config set project "$PROJECT_ID" >/dev/null

log "Enabling Google Cloud APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  aiplatform.googleapis.com

log "Ensuring Artifact Registry repository ${AR_REPO}"
if ! gcloud artifacts repositories describe "$AR_REPO" --location "$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format docker --location "$REGION" \
    --description "Heuristiq container images"
fi

log "Ensuring runtime service account ${RUN_SA}"
if ! gcloud iam service-accounts describe "$RUN_SA" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$RUN_SA_NAME" --display-name "Heuristiq Cloud Run runtime"
fi
for role in roles/aiplatform.user roles/secretmanager.secretAccessor roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member "serviceAccount:${RUN_SA}" --role "$role" --condition None >/dev/null
done

upsert_secret() {
  local name="$1" value="$2"
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --replication-policy automatic --data-file=- >/dev/null
  fi
}

log "Storing secrets in Secret Manager"
upsert_secret "${SERVICE}-supabase-service-role-key" "$SUPABASE_SERVICE_ROLE_KEY"
upsert_secret "${SERVICE}-cron-secret" "$CRON_SECRET"
SECRETS="SUPABASE_SERVICE_ROLE_KEY=${SERVICE}-supabase-service-role-key:latest,CRON_SECRET=${SERVICE}-cron-secret:latest"
if [[ -n "${RESEND_API_KEY:-}" ]]; then
  upsert_secret "${SERVICE}-resend-api-key" "$RESEND_API_KEY"
  SECRETS="${SECRETS},RESEND_API_KEY=${SERVICE}-resend-api-key:latest"
fi
if [[ -n "${GOOGLE_VERTEX_API_KEY:-}" ]]; then
  upsert_secret "${SERVICE}-vertex-api-key" "$GOOGLE_VERTEX_API_KEY"
  SECRETS="${SECRETS},GOOGLE_VERTEX_API_KEY=${SERVICE}-vertex-api-key:latest"
fi

log "Building image with Cloud Build: ${IMAGE}"
gcloud builds submit . \
  --config deploy/cloudbuild.yaml \
  --substitutions "_IMAGE=${IMAGE},_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

ENV_VARS="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
ENV_VARS+="@GOOGLE_CLOUD_LOCATION=${GOOGLE_CLOUD_LOCATION:-global}"
ENV_VARS+="@GEMINI_MODEL=${GEMINI_MODEL}"
ENV_VARS+="@GEMINI_VISION_MODEL=${GEMINI_VISION_MODEL:-$GEMINI_MODEL}"
ENV_VARS+="@MAX_BROWSER_CONTEXTS=${MAX_BROWSER_CONTEXTS}"
ENV_VARS+="@NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}"
ENV_VARS+="@NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
[[ -n "${RESEND_FROM_EMAIL:-}" ]] && ENV_VARS+="@RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL}"
[[ -n "${APP_URL:-}" ]] && ENV_VARS+="@APP_URL=${APP_URL}"

# Live persona runs stream progress over a single long-lived SSE request and
# keep abort state in instance memory, hence the long timeout and session
# affinity. Each run drives a Chromium context, hence the CPU/memory sizing.
log "Deploying Cloud Run service ${SERVICE} in ${REGION}"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --service-account "$RUN_SA" \
  --allow-unauthenticated \
  --execution-environment gen2 \
  --cpu 4 \
  --memory 8Gi \
  --cpu-boost \
  --timeout 3600 \
  --concurrency 20 \
  --session-affinity \
  --min-instances "$MIN_INSTANCES" \
  --max-instances "$MAX_INSTANCES" \
  --set-env-vars "^@^${ENV_VARS}" \
  --set-secrets "$SECRETS"

SERVICE_URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)')"

if [[ -z "${APP_URL:-}" ]]; then
  log "Setting APP_URL=${SERVICE_URL}"
  gcloud run services update "$SERVICE" --region "$REGION" --update-env-vars "APP_URL=${SERVICE_URL}" >/dev/null
  APP_URL="$SERVICE_URL"
fi

log "Scheduling daily recording cleanup with Cloud Scheduler"
JOB="${SERVICE}-cleanup-recordings"
if gcloud scheduler jobs describe "$JOB" --location "$REGION" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "$JOB" --location "$REGION" \
    --schedule "0 3 * * *" --time-zone "Etc/UTC" \
    --uri "${APP_URL}/api/cron/cleanup-recordings" --http-method GET \
    --update-headers "Authorization=Bearer ${CRON_SECRET}" >/dev/null
else
  gcloud scheduler jobs create http "$JOB" --location "$REGION" \
    --schedule "0 3 * * *" --time-zone "Etc/UTC" \
    --uri "${APP_URL}/api/cron/cleanup-recordings" --http-method GET \
    --headers "Authorization=Bearer ${CRON_SECRET}" >/dev/null
fi

log "Done"
echo "Service URL: ${SERVICE_URL}"
echo "Next: add ${APP_URL} and ${APP_URL}/** to Supabase > Authentication > URL Configuration."
