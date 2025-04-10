import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Supabase URL:', supabaseUrl?.substring(0, 10) + '...')
    console.log('Environment variables present:', !!supabaseUrl && !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables')
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching memories and media...')
    
    // First, fetch all memories
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('*')
      .order('date', { ascending: false })

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError)
      return NextResponse.json(
        { error: memoriesError.message },
        { status: 500 }
      )
    }

    // Then, fetch all media
    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .order('order_index', { ascending: true })

    if (mediaError) {
      console.error('Error fetching media:', mediaError)
      return NextResponse.json(
        { error: mediaError.message },
        { status: 500 }
      )
    }

    // Combine memories with their media
    const memoriesWithMedia = memories.map(memory => ({
      ...memory,
      media: mediaData.filter(m => m.memory_id === memory.id) || []
    }))

    console.log('Memories fetched:', memoriesWithMedia.length)
    console.log('Total media items:', mediaData.length)

    return NextResponse.json({ 
      memories: memoriesWithMedia,
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