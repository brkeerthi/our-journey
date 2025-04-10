'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/utils/date'
import { Memory, MemoryWithOptionalMedia } from '@/types'
import ImageWithFallback from '@/components/ImageWithFallback'
import { supabase } from '@/utils/supabase'
import { Spinner } from '@/components/ui/spinner'

// Function to get complete Supabase storage URL
const getStorageUrl = (path: string) => {
  if (!path) return '/placeholder.svg'
  
  // If it's already a complete URL, return it as is
  if (path.startsWith('http')) {
    return path
  }
  
  // Construct the full URL using the bucket name and path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`
}

const loveQuotes = [
  "Every day with you is a new adventure I can't wait to begin.",
  "You're not just my love, you're my best friend and soulmate.",
  "Your smile lights up my world in ways nothing else can.",
  "With you, every moment becomes a precious memory.",
  "You make my heart skip a beat, today and always.",
]

const FloatingHeart = ({ delay = 0 }) => (
  <motion.div
    className="absolute text-rose-500 opacity-80"
    initial={{ y: "100vh", x: Math.random() * 100 - 50 }}
    animate={{
      y: "-100vh",
      x: Math.random() * 200 - 100,
    }}
    transition={{
      duration: 10,
      repeat: Infinity,
      delay,
      ease: "linear"
    }}
  >
    ❤️
  </motion.div>
)

export default function Home() {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [memories, setMemories] = useState<MemoryWithOptionalMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*, media(*)')
          .order('date', { ascending: false })

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error('No memories found')
        }

        // Set all memories without filtering
        setMemories(data as MemoryWithOptionalMedia[])
      } catch (err) {
        console.error('Error fetching memories:', err)
        setError(err instanceof Error ? err.message : 'Failed to load memories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemories()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % loveQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Function to ensure memory has media before setting it as selected
  const handleSelectMemory = (memory: MemoryWithOptionalMedia) => {
    if (memory.media && memory.media.length > 0) {
      setSelectedMemory(memory as Memory)
      setCurrentMediaIndex(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-gray-600">No memories found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white relative overflow-hidden">
      {/* Floating Hearts */}
      {[...Array(10)].map((_, i) => (
        <FloatingHeart key={i} delay={i * 2} />
      ))}

      {/* Welcome Message */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center py-12 px-4"
      >
        <h1 className="font-serif text-4xl md:text-5xl text-gray-800 mb-4">
          Our Beautiful Journey Together
        </h1>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuote}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-lg md:text-xl text-gray-600 italic"
          >
            {loveQuotes[currentQuote]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Memory Counter */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block bg-white rounded-full px-6 py-3 shadow-lg"
        >
          <span className="text-gray-600">Our Journey Together: </span>
          <span className="text-rose-500 font-semibold">{memories.length} Beautiful Memories</span>
        </motion.div>
      </div>

      {/* Memory Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memories.map((memory) => (
            <motion.div
              key={memory.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl"
              onClick={() => handleSelectMemory(memory)}
            >
              {memory.media && memory.media[0] && (
                <div className="relative h-64 w-full">
                  <ImageWithFallback
                    src={getStorageUrl(memory.media[0].url)}
                    alt={memory.title}
                    fill
                    className="object-cover"
                  />
                  {memory.media[0].type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-16 h-16 flex items-center justify-center rounded-full bg-white bg-opacity-80"
                      >
                        <svg className="w-8 h-8 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{memory.title}</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-rose-500 hover:text-rose-600 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation()
                      // You can add functionality to save favorites later
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </motion.button>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(memory.date)}
                  {memory.location && (
                    <>
                      <svg className="w-4 h-4 ml-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {memory.location}
                    </>
                  )}
                </div>
                {memory.description && (
                  <p className="text-gray-600 line-clamp-3">{memory.description}</p>
                )}
              </div>
            </motion.div>
          ))}
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
            {/* Desktop View (hidden on mobile) */}
            <div className="hidden md:flex flex-1 relative">
              {/* Main Gallery Container */}
              <div 
                className="absolute inset-0 flex overflow-x-auto hide-scrollbar snap-x snap-mandatory"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const maxScroll = target.scrollWidth - target.clientWidth;
                  const currentScroll = target.scrollLeft;
                  const progress = Math.min(100, (currentScroll / maxScroll) * 100);
                  const progressBar = document.getElementById('progress-bar');
                  if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                  }
                  const itemWidth = target.scrollWidth / (selectedMemory.media?.length || 1);
                  const newIndex = Math.min(
                    Math.round(currentScroll / itemWidth),
                    (selectedMemory.media?.length || 1) - 1
                  );
                  setCurrentMediaIndex(newIndex);
                }}
              >
                <div className="flex h-full items-center pl-[calc(50vw-350px)]">
                  {selectedMemory.media?.map((mediaItem, index) => (
                    <div 
                      key={mediaItem.id}
                      className="flex-none flex flex-col items-center justify-center mr-2 snap-center"
                    >
                      <div className="relative w-[700px] max-h-[80vh] flex items-center justify-center">
                        {mediaItem.type === 'video' ? (
                          <video
                            src={getStorageUrl(mediaItem.url)}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            controls
                            autoPlay
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="relative w-auto h-auto" onClick={(e) => e.stopPropagation()}>
                            <ImageWithFallback
                              src={getStorageUrl(mediaItem.url)}
                              alt={selectedMemory.title}
                              width={1920}
                              height={1080}
                              priority
                              quality={90}
                              className="w-auto h-auto max-w-[700px] max-h-[80vh] object-contain rounded-lg"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-white/50 font-light text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent h-[40%]">
                <div className="absolute bottom-0 inset-x-0 pl-12 pr-24 pb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-white/70 text-sm tracking-[0.2em] font-light">
                      {formatDate(selectedMemory.date).toUpperCase()}
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
              <button
                className="absolute top-6 right-6 text-white text-4xl font-light hover:opacity-75 transition-opacity z-10 bg-black/20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
                onClick={() => setSelectedMemory(null)}
              >
                ×
              </button>
            </div>

            {/* Mobile View (hidden on desktop) */}
            <div className="md:hidden flex flex-col h-full relative">
              {/* Mobile Content Here */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                {selectedMemory.media && selectedMemory.media.length > 0 ? (
                  selectedMemory.media[currentMediaIndex]?.type === 'video' ? (
                    <video
                      src={getStorageUrl(selectedMemory.media[currentMediaIndex].url)}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <ImageWithFallback
                        src={getStorageUrl(selectedMemory.media[currentMediaIndex].url)}
                        alt={selectedMemory.title}
                        width={1920}
                        height={1080}
                        priority
                        quality={90}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                  )
                ) : (
                  <div className="text-2xl mb-4">✍️</div>
                )}
              </div>

              {/* Mobile Memory Details with Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent h-[40%] pointer-events-none" />
              <div className="absolute inset-x-0 bottom-20 px-6 z-40">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <p className="text-white/70 text-xs tracking-[0.2em] font-light">
                    {formatDate(selectedMemory.date).toUpperCase()}
                  </p>
                  <h2 className="text-white text-lg font-light tracking-wide line-clamp-1">
                    {selectedMemory.title}
                  </h2>
                  <p className="text-white/80 text-sm font-light leading-relaxed line-clamp-2">
                    {selectedMemory.description}
                  </p>
                  {selectedMemory.location && (
                    <p className="text-white/50 text-xs font-light">
                      {selectedMemory.location}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Mobile Navigation */}
              {selectedMemory.media && selectedMemory.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
                  <button
                    className="text-white bg-black/40 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentMediaIndex((prev) =>
                        prev === 0 ? selectedMemory.media.length - 1 : prev - 1
                      );
                    }}
                  >
                    ←
                  </button>
                  
                  <div className="bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
                    <p className="text-white/90 text-xs font-light">
                      {currentMediaIndex + 1} / {selectedMemory.media.length}
                    </p>
                  </div>

                  <button
                    className="text-white bg-black/40 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentMediaIndex((prev) =>
                        prev === selectedMemory.media.length - 1 ? 0 : prev + 1
                      );
                    }}
                  >
                    →
                  </button>
                </div>
              )}

              {/* Mobile Close Button */}
              <button
                className="absolute top-4 right-4 text-white text-2xl font-light z-50 bg-black/40 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedMemory(null);
                }}
              >
                ×
              </button>
            </div>

            {/* Progress Bar (desktop only) */}
            <div className="hidden md:block h-1 bg-white/10">
              <motion.div
                id="progress-bar"
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentMediaIndex / (selectedMemory.media?.length || 1)) * 100}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
