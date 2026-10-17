import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get all experiments with screenshots
    const { data: experiments, error: fetchError } = await supabase
      .from('experiments')
      .select('*')
      .eq('input_mode', 'screenshots')
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch experiments' }, { status: 500 })
    }
    
    if (!experiments || experiments.length === 0) {
      return NextResponse.json({ message: 'No screenshot experiments found' })
    }
    
    let fixedCount = 0
    const errors: string[] = []

    for (const exp of experiments) {
      // List files in this user's folder
      const { data: files, error: listError } = await supabase.storage
        .from('experiment-screenshots')
        .list(exp.user_id || '', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (listError) {
        console.error('Failed to list storage files for', exp.name, ':', listError)
      }
      try {
        const screenshots = exp.screenshots as any[]
        if (!screenshots || screenshots.length === 0) continue
        
        console.log(`[Fix URLs] Processing experiment: ${exp.name}`)
        console.log(`[Fix URLs] User folder: ${exp.user_id}`)
        console.log(`[Fix URLs] Files in storage:`, files?.map(f => f.name))
        
        // Try to match and update screenshot paths
        const updatedScreenshots: any[] = []
        let foundMatches = 0
        
        for (let i = 0; i < screenshots.length; i++) {
          const ss = screenshots[i]
          
          // Try the current path first
          const { error: downloadError } = await supabase.storage
            .from('experiment-screenshots')
            .download(ss.storage_path)
          
          if (!downloadError) {
            // File exists - just regenerate URL
            const { data: { publicUrl } } = supabase.storage
              .from('experiment-screenshots')
              .getPublicUrl(ss.storage_path)
            
            updatedScreenshots.push({ ...ss, url: publicUrl })
            foundMatches++
            continue
          }
          
          // File doesn't exist - try to find matching file in storage
          if (files && files.length > 0) {
            // Match by creation time proximity or index
            const matchedFile = files[i] // Try matching by index
            
            if (matchedFile) {
              const newPath = `${exp.user_id}/${matchedFile.name}`
              const { data: { publicUrl } } = supabase.storage
                .from('experiment-screenshots')
                .getPublicUrl(newPath)
              
              updatedScreenshots.push({
                ...ss,
                storage_path: newPath,
                url: publicUrl
              })
              foundMatches++
              console.log(`[Fix URLs] Matched ${ss.storage_path} → ${newPath}`)
            } else {
              // Keep original
              updatedScreenshots.push(ss)
            }
          } else {
            // Keep original
            updatedScreenshots.push(ss)
          }
        }
        
        // Only update if we found better matches
        if (foundMatches > 0) {
          const { error: updateError } = await supabase
            .from('experiments')
            .update({
              screenshots: updatedScreenshots,
              thumbnail_url: updatedScreenshots[0]?.url || null
            })
            .eq('id', exp.id)
          
          if (updateError) {
            errors.push(`${exp.name}: ${updateError.message}`)
          } else {
            fixedCount++
            console.log(`[Fix URLs] Updated ${exp.name} with ${foundMatches} screenshots`)
          }
        }
      } catch (error) {
        console.error(`[Fix URLs] Error processing ${exp.name}:`, error)
        errors.push(`${exp.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      totalExperiments: experiments.length,
      fixed: fixedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Fix screenshot URLs error:', error)
    return NextResponse.json(
      { error: 'Failed to fix screenshot URLs' },
      { status: 500 }
    )
  }
}
