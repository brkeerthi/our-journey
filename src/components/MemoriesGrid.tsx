'use client'

import { motion } from 'framer-motion'
import MemoryCard from './MemoryCard'
import { Memory } from '@/types/database'

interface MemoriesGridProps {
  memories: Memory[]
}

export default function MemoriesGrid({ memories }: MemoriesGridProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Our Journey
        </h1>
        <p className="text-muted text-lg">
          A collection of our most precious moments together
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories.map((memory, index) => (
          <MemoryCard
            key={memory.id}
            title={memory.title}
            description={memory.description}
            date={memory.date}
            location={memory.location}
            image_url={memory.image_url}
            index={index}
          />
        ))}
      </div>

      {memories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-12"
        >
          <p className="text-muted">No memories added yet. Start creating your journey!</p>
        </motion.div>
      )}
    </div>
  )
} 