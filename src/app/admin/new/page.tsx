'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDropzone } from 'react-dropzone'
import { Spinner } from '@/components/ui/spinner'
import ImageWithFallback from '@/components/ImageWithFallback'
import Link from 'next/link'

interface MediaPreview {
  file: File
  preview: string
  type: 'image' | 'video'
}

export default function NewMemoryPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [emoji, setEmoji] = useState('✍️')
  const [files, setFiles] = useState<MediaPreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

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

      // Create memory
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          title,
          description,
          date,
          location: location || null,
          emoji: emoji || null,
          created_at: new Date().toISOString(),
          user_id: user.id
        })
        .select()
        .single()

      if (memoryError) {
        console.error('Memory creation error:', JSON.stringify(memoryError, null, 2))
        throw new Error(`Memory creation failed: ${memoryError.message}`)
      }

      if (!memory) {
        throw new Error('Memory creation failed - no data returned')
      }

      console.log('Memory created:', memory)

      // Upload media files
      if (files.length > 0) {
        for (const file of files) {
          try {
            const fileExt = file.file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${memory.id}/${fileName}`

            console.log('Uploading file:', fileName)

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
              .from('memories')
              .upload(filePath, file.file)

            if (uploadError) {
              console.error('Upload error:', JSON.stringify(uploadError, null, 2))
              throw uploadError
            }

            console.log('File uploaded successfully:', filePath)

            // Create media record
            const { error: mediaError } = await supabase
              .from('media')
              .insert({
                memory_id: memory.id.toString(), // Convert to string to match the type
                url: filePath,
                type: file.type,
                created_at: new Date().toISOString(),
                user_id: user.id
              })

            if (mediaError) {
              console.error('Media record error:', JSON.stringify(mediaError, null, 2))
              throw mediaError
            }

            console.log('Media record created for:', filePath)
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

      router.push('/admin')
    } catch (err) {
      console.error('Error creating memory:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to create memory. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-semibold text-gray-900">Our Journey</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/admin/new"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
            >
              <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Memory
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg w-full"
            >
              <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-16 w-full">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Create New Memory</h2>
            <p className="mt-1 text-sm text-gray-500">Add a new memory to your journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6 w-full">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-base"
                    required
                    placeholder="Enter memory title"
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label htmlFor="emoji" className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji (for text-only memories)
                  </label>
                  <input
                    type="text"
                    id="emoji"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-base"
                    placeholder="Enter an emoji (e.g., ✍️, 💕, 🎉)"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-base resize-none"
                    required
                    placeholder="Describe your memory..."
                  />
                </div>

                {/* Date and Location */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-base"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-base"
                      required
                      placeholder="Enter location"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Media
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

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  'Create Memory'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 