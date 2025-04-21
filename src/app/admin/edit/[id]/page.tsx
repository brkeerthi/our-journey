'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDropzone } from 'react-dropzone'
import { Spinner } from '@/components/ui/spinner'
import ImageWithFallback from '@/components/ImageWithFallback'
import Link from 'next/link'
import { use } from 'react'
import { Memory } from '@/types'
import Image from 'next/image'

interface MediaPreview {
  file: File
  preview: string
  type: 'image' | 'video'
}

interface ExistingMedia {
  id: string
  url: string
  type: 'image' | 'video'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditMemoryPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [files, setFiles] = useState<MediaPreview[]>([])
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchMemory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .select('*, media(*)')
        .eq('id', id)
        .single()

      if (memoryError) {
        console.error('Error fetching memory:', memoryError)
        setError('Failed to fetch memory details')
        setIsLoading(false)
        return
      }

      if (!memory) {
        setError('Memory not found')
        setIsLoading(false)
        return
      }

      setTitle(memory.title)
      setDescription(memory.description)
      setDate(memory.date)
      setLocation(memory.location)
      setExistingMedia(memory.media.map((m: { id: string; url: string; type: 'image' | 'video' }) => ({
        id: m.id,
        url: m.url,
        type: m.type
      })))
      setIsLoading(false)
    }

    fetchMemory()
  }, [id, router, supabase])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    }
  })

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const removeExistingMedia = async (mediaId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId)

      if (deleteError) throw deleteError

      setExistingMedia(prev => prev.filter(m => m.id !== mediaId))
    } catch (err) {
      console.error('Error removing media:', err)
      setError('Failed to remove media')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      // Delete all media records first
      const { error: mediaDeleteError } = await supabase
        .from('media')
        .delete()
        .eq('memory_id', id)

      if (mediaDeleteError) throw mediaDeleteError

      // Delete the memory
      const { error: memoryDeleteError } = await supabase
        .from('memories')
        .delete()
        .eq('id', id)

      if (memoryDeleteError) throw memoryDeleteError

      router.push('/admin')
    } catch (err) {
      console.error('Error deleting memory:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to delete memory. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      // Update memory
      const updateData = {
        title,
        description,
        date,
        location,
        user_id: user.id
      }

      console.log('Updating memory with data:', updateData)

      const { data: updateResult, error: memoryError } = await supabase
        .from('memories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()

      if (memoryError) {
        console.error('Memory update error:', memoryError)
        throw new Error(memoryError.message || 'Failed to update memory')
      }

      if (!updateResult || updateResult.length === 0) {
        throw new Error('Failed to update memory - no rows affected')
      }

      console.log('Memory updated successfully:', updateResult)

      // Upload new media files
      if (files.length > 0) {
        for (const file of files) {
          try {
            const fileExt = file.file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${id}/${fileName}`

            console.log('Uploading file:', fileName)

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
              .from('memories')
              .upload(filePath, file.file, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('File upload error:', uploadError)
              throw uploadError
            }

            // Create media record
            const { error: mediaError } = await supabase
              .from('media')
              .insert({
                memory_id: id,
                url: filePath,
                type: file.type,
                created_at: new Date().toISOString(),
                user_id: user.id
              })

            if (mediaError) {
              console.error('Media record creation error:', mediaError)
              throw mediaError
            }

            console.log('File uploaded and media record created successfully')
          } catch (err) {
            console.error('Error processing file:', file.file.name, err)
            throw err
          }
        }
      }

      // Clean up preview URLs
      files.forEach(file => {
        URL.revokeObjectURL(file.preview)
      })

      // Revalidate and redirect
      try {
        // Revalidate both the admin and main pages
        await fetch('/api/revalidate?path=/admin')
        await fetch('/api/revalidate?path=/')
        
        // Force a hard navigation to refresh the data
        window.location.href = '/admin'
      } catch (revalidateError) {
        console.error('Error revalidating pages:', revalidateError)
        // Still redirect even if revalidation fails
        window.location.href = '/admin'
      }
    } catch (err) {
      console.error('Error updating memory:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to update memory. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900">
            Keerthi &amp; Rakshitha&apos;s
          </h1>
          <h2 className="text-xl text-gray-600 mt-1 tracking-wide">
            Edit Memory
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-full">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm"
                  required
                  placeholder="Enter memory title"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm resize-none"
                  required
                  placeholder="Describe your memory..."
                />
              </div>

              {/* Date and Location */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm"
                    required
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Existing Media */}
          {existingMedia.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                Existing Media
              </label>
              <div className="grid grid-cols-2 gap-4">
                {existingMedia.map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                    {media.type === 'video' ? (
                      <video
                        src={supabase.storage.from('memories').getPublicUrl(media.url).data.publicUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <ImageWithFallback
                        src={supabase.storage.from('memories').getPublicUrl(media.url).data.publicUrl}
                        alt="Memory"
                        fill
                        className="object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingMedia(media.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-75 text-gray-900 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Upload */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                Add New Media
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
              >
                <input {...getInputProps()} />
                <div className="text-gray-600">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-4 text-sm font-medium">Drag and drop files here, or click to select files</p>
                  <p className="mt-2 text-xs text-gray-500">Images and videos supported</p>
                </div>
              </div>

              {/* Preview Grid */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {files.map((file, index) => (
                    <div key={file.preview} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                      {file.type === 'video' ? (
                        <video
                          src={file.preview}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <ImageWithFallback
                          src={file.preview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-75 text-gray-900 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                'Delete Memory'
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 