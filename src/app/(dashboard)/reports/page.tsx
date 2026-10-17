import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsListClient } from '@/components/reports/reports-list-client'

export default async function ReportsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch completed experiments (reports)
  const { data: experiments } = await supabase
    .from('experiments')
    .select(`
      *,
      project:projects(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ReportsListClient
        experiments={experiments || []}
        projects={projects || []}
      />
    </div>
  )
}
