'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface MemoryCardProps {
  title: string
  description: string
  date: string
  location?: string
  image_url?: string
  index: number
}

export default function MemoryCard({ title, description, date, location, image_url, index }: MemoryCardProps) {
  // Convert signed URL to public URL
  const getPublicUrl = (url?: string) => {
    if (!url) return undefined
    try {
      // Extract the path from the signed URL
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/(memories\/images\/.+?)(?:\?|$)/)
      if (pathMatch && pathMatch[1]) {
        return `https://utzwsgxpblcxqhiaphuv.supabase.co/storage/v1/object/public/${pathMatch[1]}`
      }
      return url
    } catch (e) {
      console.error('Error processing URL:', e)
      return url
    }
  }

  const publicUrl = getPublicUrl(image_url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-background border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      {publicUrl && (
        <div className="relative w-full aspect-[16/9]">
          <Image
            src={publicUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index < 4}
          />
        </div>
      )}
      <div className="p-4 flex-1">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted text-sm mb-2">{description}</p>
        <div className="flex items-center justify-between text-xs text-muted mt-auto">
          <span>{format(new Date(date), 'MMMM d, yyyy')}</span>
          {location && <span>{location}</span>}
        </div>
      </div>
    </motion.div>
  )
} 