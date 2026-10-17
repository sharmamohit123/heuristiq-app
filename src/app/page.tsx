import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/landing-page'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Otherwise, show the landing page
  return <LandingPage />
}
