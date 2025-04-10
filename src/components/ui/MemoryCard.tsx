import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import type { Memory } from '@/lib/supabase/config'

interface MemoryCardProps {
  memory: Memory
  onClick: () => void
}

export default function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-48 w-full">
        {memory.media_urls[0] && (
          <Image
            src={memory.media_urls[0]}
            alt={memory.title}
            fill
            className="object-cover"
          />
        )}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/30 flex items-center justify-center"
        >
          <p className="text-white text-lg font-medium">View Memory</p>
        </motion.div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{memory.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{memory.date}</p>
        <p className="text-gray-700 line-clamp-2">{memory.description}</p>
      </div>
    </motion.div>
  )
} 