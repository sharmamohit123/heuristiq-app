import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExperimentsListClient } from '@/components/experiments/experiments-list-client'

export default async function ExperimentsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: experiments } = await supabase
    .from('experiments')
    .select(`
      *,
      project:projects(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExperimentsListClient 
        experiments={experiments || []}
        projects={projects || []}
      />
    </div>
  )
}
