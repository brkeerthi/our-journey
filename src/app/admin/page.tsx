'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Memory } from '@/types'
import { Spinner } from '@/components/ui/spinner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const getStorageUrl = (path: string) => {
  if (!path) return ''
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `https://utzwsgxpblcxqhiaphuv.supabase.co/storage/v1/object/public/memories/${cleanPath}`
}

export default function AdminPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setMemories([]) // Clear cached data
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const fetchMemories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data, error } = await supabase
        .from('memories')
        .select('*, media(*)')
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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-medium text-gray-900">
              Keerthi &amp; Rakshitha&apos;s
            </h1>
            <h2 className="text-xl text-gray-600 mt-1 tracking-wide">
              Memories dashboard
            </h2>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Sign out
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Memories</h3>
            <p className="text-2xl font-medium text-gray-900 mt-2">{memories.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Memory</h3>
            <p className="text-2xl font-medium text-gray-900 mt-2">
              {memories[0]?.date ? new Date(memories[0].date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Media Items</h3>
            <p className="text-2xl font-medium text-gray-900 mt-2">
              {memories.reduce((acc, memory) => acc + (memory.media?.length || 0), 0)}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-gray-600 mt-1 tracking-wide">Memories</h2>
          <button
            onClick={() => router.push('/admin/new')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Add New Memory
          </button>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thumbnail
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memories.map((memory) => (
                <tr key={memory.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {memory.media && memory.media.length > 0 ? (
                        <Image
                          src={getStorageUrl(memory.media[0].url)}
                          alt={memory.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                          onError={() => {
                            console.error('Image failed to load:', memory.media[0].url);
                            console.log('Full URL:', getStorageUrl(memory.media[0].url));
                          }}
                        />
                      ) : (
                        <span className="text-2xl">{memory.emoji || '✍️'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{memory.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(memory.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{memory.location || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{memory.media?.length || 0} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => router.push(`/admin/edit/${memory.id}`)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 