'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FilePreview {
  file: File
  preview: string
}

export default function NewMemoryPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Please sign in to create a memory')
      }

      // Create the memory
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          title,
          description,
          location: location || null,
          date: date,
          created_at: new Date().toISOString(),
          user_id: user.id
        })
        .select()
        .single()

      if (memoryError) throw memoryError

      // Upload media files
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const fileExt = file.file.name.split('.').pop()
          const fileName = `${memory.id}/${Date.now()}-${i}.${fileExt}`

          // Upload file to storage
          const { error: uploadError } = await supabase
            .storage
            .from('memories')
            .upload(fileName, file.file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('memories')
            .getPublicUrl(fileName)

          // Create media record
          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              memory_id: memory.id,
              url: publicUrl,
              type: file.file.type.startsWith('video/') ? 'video' : 'image',
              order_index: i
            })

          if (mediaError) throw mediaError
        }
      }

      // Show success toast and navigate to admin dashboard
      toast.success('Memory uploaded... go make more! 😊', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
      })

      router.push('/admin')
      router.refresh()

    } catch (error) {
      console.error('Error creating memory:', error)
      setError(error instanceof Error ? error.message : 'Failed to create memory')
      toast.error('Failed to create memory', {
        duration: 3000,
        position: 'bottom-center',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview))
    }
  }, [selectedFiles])

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-light">Create Memory</h1>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-light text-gray-700">Title</label>
            <input
              type="text"
              placeholder="Enter a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-sm font-light text-gray-700">Description</label>
            <textarea
              placeholder="Write about this memory..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 min-h-[100px]"
            />
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label className="block text-sm font-light text-gray-700">Location</label>
            <input
              type="text"
              placeholder="Where did this happen? (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Date Input */}
          <div className="space-y-2">
            <label className="block text-sm font-light text-gray-700">Date of Memory</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-light text-gray-700">Media</label>
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">Images and videos</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* Thumbnail Preview Grid */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {file.file.type.startsWith('image/') ? (
                        <Image
                          src={file.preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={file.preview}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <motion.button
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveFile(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 font-light rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSubmit}
              className="px-4 py-2 bg-black text-white rounded-lg font-light disabled:opacity-50 flex items-center space-x-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isSubmitting || !title || !description}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Memory'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
} 