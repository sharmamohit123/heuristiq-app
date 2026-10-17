import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()
  
  const profile = profileData as { name: string | null } | null

  // Fetch or create projects
  let { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // If no projects exist, create a default one
  if (!projectsData || projectsData.length === 0) {
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: 'My First Project',
        description: 'Your default project - feel free to rename or create new projects',
      })
      .select()
      .single()

    if (!error && newProject) {
      projectsData = [newProject]
    }
  }

  // Fetch ALL experiments with projects
  const { data: experimentsData } = await supabase
    .from('experiments')
    .select(`
      *,
      project:projects(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const experiments = experimentsData || []
  const projects = projectsData || []

  const userName = profile?.name?.split(' ')[0] || 'there'

  // Note: Total findings will be calculated client-side per project
  // Server component passes all experiments, client filters by project
  return (
    <DashboardClient
      initialProjects={projects}
      initialExperiments={experiments}
      userName={userName}
    />
  )
}
