import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

interface MediaItem {
  id: string
  url: string
  type: string
  order_index: number
}

interface Memory {
  id: string
  title: string
  description: string
  date: string
  location: string
  media: MediaItem[]
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Fetching memories and media...')
    
    // Fetch memories with their media in a single query
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select(`
        *,
        media (
          id,
          url,
          type,
          order_index
        )
      `)
      .order('date', { ascending: false })

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError)
      return NextResponse.json(
        { error: memoriesError.message },
        { status: 500 }
      )
    }

    // Sort media items by order_index for each memory
    const memoriesWithSortedMedia = (memories as Memory[]).map(memory => ({
      ...memory,
      media: memory.media.sort((a: MediaItem, b: MediaItem) => (a.order_index || 0) - (b.order_index || 0))
    }))

    console.log('Memories fetched:', memoriesWithSortedMedia.length)
    console.log('Sample memory:', memoriesWithSortedMedia[0]?.id)

    return NextResponse.json({ 
      memories: memoriesWithSortedMedia,
      message: 'Memories fetched successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 