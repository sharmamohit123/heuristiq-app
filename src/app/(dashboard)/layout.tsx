import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { NavigationLoader } from '@/components/ui/navigation-loader'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userData = profile ? {
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatar_url,
  } : {
    email: user.email || '',
    name: null,
    avatar_url: null,
  }

  return (
    <>
      <NavigationLoader />
    <div className="flex h-screen bg-background">
      <Sidebar user={userData} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
    </>
  )
}
