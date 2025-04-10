'use client'

import { motion, AnimatePresence, useTransform, useMotionValue } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface MediaItem {
  id: string
  memory_id: string
  url: string
  type: 'image' | 'video'
  created_at: string
  order_index: number
}

interface Memory {
  id: string
  title: string
  description: string
  created_at: string
  date: string
  location?: string
  media: MediaItem[]
}

export default function Home() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollProgress = useMotionValue(0)
  const titleOpacity = useTransform(
    scrollProgress, 
    [0, 50], // Input range (0% to 50% scroll)
    [1, 0]   // Output range (fully visible to invisible)
  )

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        console.log('Fetching memories from API...')
        const response = await fetch('/api/memories')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch memories')
        }

        if (data.memories) {
          console.log('Memories fetched:', data.memories.length)
          setMemories(data.memories)
        }
      } catch (error) {
        console.error('Error fetching memories:', error)
      }
    }

    fetchMemories()
  }, [])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current
      const firstMemoryPosition = clientWidth * 0.33 // 33vw from left where memories start
      
      // Calculate progress based on first memory card position
      const progress = Math.min(100, Math.max(0, (scrollLeft / firstMemoryPosition) * 50))
      scrollProgress.set(progress)
    }
  }

  const clearAllMemories = async () => {
    if (process.env.NODE_ENV !== 'development') return
    
    if (window.confirm('Are you sure you want to delete all memories? This cannot be undone!')) {
      setIsDeleting(true)
      try {
        // First delete all media records
        const { error: mediaDeleteError } = await supabase
          .from('media')
          .delete()
          .not('id', 'is', null)

        if (mediaDeleteError) throw mediaDeleteError

        // Then delete all memories
        const { error: memoriesDeleteError } = await supabase
          .from('memories')
          .delete()
          .not('id', 'is', null)

        if (memoriesDeleteError) throw memoriesDeleteError

        setMemories([])
        alert('All memories have been deleted successfully!')
      } catch (error) {
        console.error('Error deleting memories:', error)
        alert('Error deleting memories. Please check the console for details.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-white">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] bg-noise" />
      
      <div className="h-full flex relative">
        {/* Title Section */}
        <motion.div 
          className="fixed left-16 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          style={{ opacity: titleOpacity }}
          initial={{ opacity: 1 }}
        >
          <motion.h1 
            className="text-[64px] leading-none tracking-[-0.02em] font-light text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            KEERTHI<br />&<br />RAKSHITHA
          </motion.h1>
        </motion.div>

        {/* Timeline Section */}
        <div className="w-full flex items-center">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory h-full items-center min-w-0 pl-[33vw]"
          >
            <div className="flex gap-24 pr-24">
              {memories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="flex-none snap-center relative"
                >
                  <div className="w-[250px] flex flex-col items-center">
                    {memory.media.length > 0 ? (
                      <motion.div 
                        className="relative h-[400px] cursor-pointer perspective-1000"
                        whileHover="hover"
                        initial="initial"
                        animate="initial"
                        onClick={() => {
                          setSelectedMemory(memory)
                          setCurrentMediaIndex(0)
                        }}
                      >
                        {/* Background Cards - Third Layer */}
                        {memory.media.length > 2 && (
                          <motion.div 
                            className="absolute top-4 left-1/2 -translate-x-1/2 w-[250px] aspect-[4/5] bg-white rounded-xl shadow-[0_8px_16px_-8px_rgba(0,0,0,0.3)] origin-top overflow-hidden"
                            variants={{
                              initial: { rotate: -8, y: 0, scale: 0.95, x: "-52%" },
                              hover: { 
                                rotate: -12, 
                                y: 24,
                                scale: 0.9,
                                x: "-55%",
                                transition: { delay: 0.1, duration: 0.5 }
                              }
                            }}
                          >
                            <Image
                              src={memory.media[2].url}
                              alt={memory.title}
                              fill
                              className="object-cover grayscale"
                            />
                          </motion.div>
                        )}

                        {/* Background Cards - Second Layer */}
                        {memory.media.length > 1 && (
                          <motion.div 
                            className="absolute top-2 left-1/2 -translate-x-1/2 w-[250px] aspect-[4/5] bg-white rounded-xl shadow-[0_12px_20px_-8px_rgba(0,0,0,0.3)] origin-top overflow-hidden"
                            variants={{
                              initial: { rotate: 4, y: 0, scale: 0.98, x: "-48%" },
                              hover: { 
                                rotate: 8, 
                                y: 16,
                                scale: 0.95,
                                x: "-45%",
                                transition: { delay: 0.2, duration: 0.5 }
                              }
                            }}
                          >
                            <Image
                              src={memory.media[1].url}
                              alt={memory.title}
                              fill
                              className="object-cover grayscale"
                            />
                          </motion.div>
                        )}
                        
                        {/* Main Image Card */}
                        <motion.div 
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] aspect-[4/5] bg-white rounded-xl shadow-[0_16px_24px_-8px_rgba(0,0,0,0.3)] overflow-hidden group transform-gpu"
                          variants={{
                            initial: { scale: 1, y: 0, rotate: 0, x: "-50%" },
                            hover: { 
                              scale: 1.15,
                              y: -8,
                              rotate: -2,
                              x: "-50%",
                              transition: { 
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                mass: 0.8
                              }
                            }
                          }}
                        >
                          <div className="relative w-full h-full">
                            <Image
                              src={memory.media[0].url}
                              alt={memory.title}
                              fill
                              className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                            />
                          </div>
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"
                            variants={{
                              initial: { opacity: 0 },
                              hover: { 
                                opacity: 1,
                                transition: { duration: 0.4 }
                              }
                            }}
                          />
                        </motion.div>

                        {/* Connecting Line */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-[60px] bg-gray-300" />
                      </motion.div>
                    ) : (
                      // Card UI for memories without media
                      <motion.div
                        className="relative h-[400px]"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="w-[250px] aspect-[4/5] bg-white rounded-xl shadow-[0_8px_16px_-8px_rgba(0,0,0,0.2)] overflow-hidden">
                          <div className="h-full flex flex-col">
                            {/* Card Header with Gradient */}
                            <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <span className="text-gray-400">✍️</span>
                              </div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="flex-1 p-6 flex items-center justify-center">
                              <p className="text-sm text-gray-500 font-light line-clamp-[10] leading-relaxed text-center max-w-[90%]">
                                {memory.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Connecting Line */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-[60px] bg-gray-300" />
                      </motion.div>
                    )}

                    {/* Number */}
                    <motion.p 
                      className="font-light text-4xl text-gray-300 mb-0.5"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {String(index + 1).padStart(2, '0')}.
                    </motion.p>

                    {/* Date */}
                    <motion.p 
                      className="font-light text-sm tracking-[0.15em] text-gray-500 mb-2"
                      whileHover={{ y: -2 }}
                    >
                      {new Date(memory.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                    </motion.p>

                    {/* Title */}
                    <motion.h3 
                      className="text-base font-light tracking-[0.05em] text-center max-w-[90%] text-gray-800"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {memory.title}
                    </motion.h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image View */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          >
            {/* Main Content Area */}
            <div className="flex-1 relative">
              {/* Scrollable Gallery */}
              <div 
                className="absolute inset-0 flex overflow-x-auto hide-scrollbar snap-x snap-mandatory"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const maxScroll = target.scrollWidth - target.clientWidth;
                  const currentScroll = target.scrollLeft;
                  
                  // Calculate progress ensuring it reaches 100% at the end
                  const progress = Math.min(100, (currentScroll / maxScroll) * 100);
                  
                  // Update progress bar width
                  const progressBar = document.getElementById('progress-bar');
                  if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                  }
                  
                  // Calculate current media index more accurately
                  const itemWidth = target.scrollWidth / selectedMemory.media.length;
                  const newIndex = Math.min(
                    Math.round(currentScroll / itemWidth),
                    selectedMemory.media.length - 1
                  );
                  setCurrentMediaIndex(newIndex);
                }}
              >
                <div className="flex h-full items-center pl-[calc(50vw-350px)]">
                  {selectedMemory.media.map((media, index) => (
                    <div 
                      key={media.id}
                      className="flex-none flex flex-col items-center justify-center mr-6 snap-center"
                    >
                      <div className="relative w-[700px] aspect-[4/3] overflow-hidden rounded-2xl">
                        {media.type === 'video' ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-contain rounded-2xl"
                            controls
                            autoPlay
                          />
                        ) : (
                          <Image
                            src={media.url}
                            alt={selectedMemory.title}
                            fill
                            className="object-contain rounded-2xl"
                            priority
                          />
                        )}
                      </div>
                      <div className="mt-2 text-white/50 font-light text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent h-[40%]">
                <div className="absolute bottom-0 inset-x-0 pl-12 pr-24 pb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-white/70 text-sm tracking-[0.2em] font-light">
                      {new Date(selectedMemory.created_at).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }).toUpperCase()}
                    </p>
                    <h2 className="text-white text-3xl font-light tracking-wide">
                      {selectedMemory.title}
                    </h2>
                    <p className="text-white/80 font-light leading-relaxed max-w-2xl">
                      {selectedMemory.description}
                    </p>
                    {selectedMemory.location && (
                      <p className="text-white/50 text-sm font-light">
                        {selectedMemory.location}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                className="absolute top-6 right-6 text-white text-4xl font-light hover:opacity-75 transition-opacity z-10 bg-black/20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
                onClick={() => setSelectedMemory(null)}
                whileHover={{ scale: 1.1 }}
              >
                ×
              </motion.button>
            </div>

            {/* Bottom Controls */}
            <div className="h-1 bg-white/10">
              <motion.div
                id="progress-bar"
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentMediaIndex / (selectedMemory.media.length - 1)) * 100}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Development Mode Controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-16 right-16 z-50">
          <motion.button
            className="bg-red-500/80 text-white px-4 py-2 rounded-full text-sm font-light backdrop-blur-sm hover:bg-red-500 transition-colors flex items-center gap-2"
            onClick={clearAllMemories}
            disabled={isDeleting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Clear All Memories'
            )}
          </motion.button>
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}
