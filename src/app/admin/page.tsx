'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface MediaItem {
  id: string
  memory_id: string
  url: string
  type: 'image' | 'video'
  order_index: number
}

interface Memory {
  id: string
  title: string
  description: string
  location: string | null
  date: string
  created_at: string
  user_id: string
  media: MediaItem[]
}

interface FilePreview {
  file: File
  preview: string
}

export default function AdminDashboard() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }
    }

    const fetchMemories = async () => {
      try {
        // First, fetch all memories
        const { data: memories, error: memoriesError } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false })

        if (memoriesError) throw memoriesError

        // Then, fetch all media
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .order('order_index', { ascending: true })

        if (mediaError) throw mediaError

        // Combine memories with their media
        const memoriesWithMedia = memories?.map(memory => ({
          ...memory,
          media: mediaData?.filter((m: MediaItem) => m.memory_id === memory.id) || []
        })) || []

        setMemories(memoriesWithMedia)
      } catch (err) {
        console.error('Error fetching memories:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch memories')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
    fetchMemories()
  }, [router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setSelectedFiles(prev => [...prev, ...newPreviews])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview) // Clean up the URL
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview))
    }
  }, [])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your memories
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/memories/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Memory
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : memories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              +0 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visual Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : memories.filter(m => m.media.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Memories with images
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Places Remembered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : memories.filter(m => m.location).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Memories with locations
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Latest Memories</CardTitle>
              <Link href="/admin/memories">
                <Button variant="ghost" className="text-sm text-muted-foreground">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading memories...</p>
              </div>
            ) : memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No memories yet</p>
                <Link href="/admin/memories/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add your first memory
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {memories.slice(0, 5).map((memory) => (
                  <div key={memory.id} className="p-4 border-b last:border-b-0">
                    <h3 className="text-lg font-light">{memory.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(memory.date).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    {memory.location && (
                      <p className="text-sm text-gray-500 mt-1">{memory.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 