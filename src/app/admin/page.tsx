'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Memory {
  id: string
  title: string
  description: string
  location: string | null
  date: string
  user_id: string
}

export default function AdminPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  useEffect(() => {
    const fetchMemories = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false })

      if (memories) {
        setMemories(memories)
      }
    }

    fetchMemories()
  }, [supabase, router])

  useEffect(() => {
    if (selectedFiles.length > 0) {
      console.log('Selected files:', selectedFiles)
    }
  }, [selectedFiles])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map((memory) => (
          <Card key={memory.id} className="p-4">
            <h3 className="font-semibold">{memory.title}</h3>
            <p className="text-sm text-gray-600">{memory.date}</p>
            <p className="mt-2">{memory.description}</p>
            <p className="text-sm text-gray-500 mt-2">{memory.location}</p>
          </Card>
        ))}
      </div>
    </div>
  )
} 