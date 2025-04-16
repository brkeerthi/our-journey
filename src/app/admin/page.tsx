'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Memory } from '@/types'
import { Spinner } from '@/components/ui/spinner'
import { useRouter } from 'next/navigation'
import AdminNav from '@/components/AdminNav'

export default function AdminPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const fetchMemories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      setMemories(data || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  if (isLoading) {
    return (
      <AdminNav>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AdminNav>
    )
  }

  return (
    <AdminNav>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Memories</h1>
          <button
            onClick={() => router.push('/admin/new')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add New Memory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">{memory.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{memory.date}</p>
              <button
                onClick={() => router.push(`/admin/edit/${memory.id}`)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Edit Memory
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminNav>
  )
} 