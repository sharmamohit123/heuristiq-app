'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, Experiment } from '@/types/database'
import { ProjectHeader } from './project-header'
import { DashboardContent } from './dashboard-content'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  initialProjects: Project[]
  initialExperiments: any[]
  userName: string
}

export function DashboardClient({ 
  initialProjects, 
  initialExperiments,
  userName 
}: DashboardClientProps) {
  const router = useRouter()
  
  // Start with first project (server-safe), update from localStorage after mount
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjects[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalFindings, setTotalFindings] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)

  // Restore project selection from localStorage after client hydration
  useEffect(() => {
    setIsHydrated(true)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('heuristiq-current-project')
      if (stored && initialProjects.some(p => p.id === stored)) {
        setCurrentProjectId(stored)
      }
    }
  }, [])

  // Save project selection to localStorage
  const handleProjectChange = (projectId: string) => {
    setCurrentProjectId(projectId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('heuristiq-current-project', projectId)
    }
    router.refresh() // Refresh to get project-specific data
  }

  // Ensure we have a current project
  useEffect(() => {
    if (!currentProjectId && initialProjects.length > 0) {
      handleProjectChange(initialProjects[0].id)
    }
  }, [initialProjects])

  // Fetch findings count when project changes
  useEffect(() => {
    const fetchFindings = async () => {
      if (!currentProjectId) {
        setTotalFindings(0)
        return
      }

      const supabase = createClient()
      
      // Get all completed experiments for this project
      const projectExperiments = initialExperiments.filter(
        e => e.project_id === currentProjectId && e.status === 'completed'
      )
      
      if (projectExperiments.length === 0) {
        setTotalFindings(0)
        return
      }

      const experimentIds = projectExperiments.map(e => e.id)
      
      // Count findings for these experiments
      const { count } = await supabase
        .from('findings')
        .select('*', { count: 'exact', head: true })
        .in('experiment_id', experimentIds)

      setTotalFindings(count || 0)
    }

    fetchFindings()
  }, [currentProjectId, initialExperiments])

  // Filter experiments by current project
  let projectExperiments = currentProjectId
    ? initialExperiments.filter(e => e.project_id === currentProjectId)
    : initialExperiments

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    projectExperiments = projectExperiments.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.hypothesis?.toLowerCase().includes(query) ||
      e.script?.toLowerCase().includes(query)
    )
  }

  return (
    <>
      <ProjectHeader
        projects={initialProjects}
        currentProjectId={currentProjectId}
        onProjectChange={handleProjectChange}
        onSearch={setSearchQuery}
      />
      <DashboardContent
        experiments={projectExperiments}
        projects={initialProjects}
        currentProjectId={currentProjectId}
        totalFindings={totalFindings}
        userName={userName}
        searchQuery={searchQuery}
      />
    </>
  )
}
