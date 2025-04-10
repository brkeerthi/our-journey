'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'

export default function AddMemoryForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget as HTMLFormElement
    const formElements = form.elements as HTMLFormControlsCollection

    try {
      // First, check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      if (!session) {
        throw new Error('You must be logged in to add memories')
      }

      const titleInput = formElements.namedItem('title') as HTMLInputElement
      const descriptionInput = formElements.namedItem('description') as HTMLTextAreaElement
      const dateInput = formElements.namedItem('date') as HTMLInputElement
      const locationInput = formElements.namedItem('location') as HTMLInputElement
      const imageInput = formElements.namedItem('image') as HTMLInputElement

      const title = titleInput.value
      const description = descriptionInput.value
      const date = dateInput.value
      const location = locationInput.value
      const imageFile = imageInput.files?.[0]

      let image_url: string | undefined

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        // Upload the file to Supabase storage
        const { error: uploadError, data } = await supabase.storage
          .from('memories')
          .upload(`images/${fileName}`, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('memories')
          .getPublicUrl(`images/${fileName}`)

        image_url = publicUrl
      }

      const { error: insertError } = await supabase
        .from('memories')
        .insert({
          title,
          description,
          date,
          location: location || null,
          image_url,
          user_id: session.user.id
        })

      if (insertError) throw insertError

      router.refresh()
      form.reset()
      setError(null)
      // Show success message or redirect
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while saving the memory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-foreground">
          Date
        </label>
        <input
          type="date"
          name="date"
          id="date"
          required
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-foreground">
          Location (optional)
        </label>
        <input
          type="text"
          name="location"
          id="location"
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-foreground">
          Image (optional)
        </label>
        <input
          type="file"
          name="image"
          id="image"
          accept="image/*"
          className="mt-1 block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent-hover"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Memory...' : 'Add Memory'}
        </button>
      </div>
    </form>
  )
} 