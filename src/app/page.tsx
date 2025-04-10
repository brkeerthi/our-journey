'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { formatDate } from '@/utils/date'
import { Memory, MemoryWithOptionalMedia } from '@/types'
import ImageWithFallback from '@/components/ImageWithFallback'
import { supabase } from '@/utils/supabase'
import { Spinner } from '@/components/ui/spinner'
import LoginOverlay from '@/components/LoginOverlay'

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

export default function Home() {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [memories, setMemories] = useState<MemoryWithOptionalMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAnimatingIn, setIsAnimatingIn] = useState(false)
  const [showOnlyMedia, setShowOnlyMedia] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollProgress = useMotionValue(0)
  const titleOpacity = useTransform(
    scrollProgress,
    [0, 50], // Input range (0% to 50% scroll)
    [1, 0]   // Output range (fully visible to invisible)
  )

  useEffect(() => {
    // Check if it's a hard refresh
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const isHardRefresh = navEntry?.type === 'reload'

    if (isHardRefresh) {
      localStorage.removeItem('authenticated')
      setIsAuthenticated(false)
    } else {
      const authenticated = localStorage.getItem('authenticated') === 'true'
      setIsAuthenticated(authenticated)
    }
  }, [])

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        if (!isAuthenticated) return

        const { data, error } = await supabase
          .from('memories')
          .select('*, media(*)')
          .order('date', { ascending: true })

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error('No memories found')
        }

        setMemories(data as MemoryWithOptionalMedia[])
        // Set loading to false after data is loaded
        setIsLoading(false)
        // Reset animation state after a short delay
        setTimeout(() => {
          setIsAnimatingIn(false)
        }, 800)
      } catch (err) {
        console.error('Error fetching memories:', err)
        setError(err instanceof Error ? err.message : 'Failed to load memories')
        setIsLoading(false)
        setIsAnimatingIn(false)
      }
    }

    if (isAuthenticated) {
      setIsAnimatingIn(true)
      // Start fetching memories immediately after authentication
      fetchMemories()
    }
  }, [isAuthenticated])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current
      const firstMemoryPosition = clientWidth * 0.33 // 33vw from left where memories start
      const progress = Math.min(100, Math.max(0, (scrollLeft / firstMemoryPosition) * 50))
      scrollProgress.set(progress)
    }
  }

  // Function to ensure memory has media before setting it as selected
  const handleSelectMemory = (memory: MemoryWithOptionalMedia) => {
    if (memory.media && memory.media.length > 0) {
      setSelectedMemory(memory as Memory)
      setCurrentMediaIndex(0)
    }
  }

  // Filter memories based on showOnlyMedia toggle
  const filteredMemories = showOnlyMedia 
    ? memories.filter(memory => memory.media && memory.media.length > 0)
    : memories

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginOverlay onAuthenticated={() => setIsAuthenticated(true)} />
  }

  if (isLoading || isAnimatingIn) {
    return (
      <div className="h-screen overflow-hidden bg-white">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex relative"
        >
          {/* Mobile Title Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="md:hidden fixed top-0 inset-x-0 z-10 bg-white/95 backdrop-blur-sm"
          >
            <div className="px-6 py-3 text-center">
              <h1 className="text-3xl tracking-[-0.02em] font-light text-gray-800">
                Keerthi & Rakshitha&apos;s
              </h1>
              <p className="text-xl text-gray-500 mt-0.5 font-light tracking-wide">
                Echoes of shared time.
              </p>
            </div>
          </motion.div>

          {/* Desktop Title Section */}
          <motion.div 
            className="fixed left-16 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden md:block"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.div className="flex flex-col">
              <span className="text-[56px] leading-tight tracking-[-0.02em] font-light text-gray-800">
                Keerthi &
              </span>
              <span className="text-[56px] leading-tight tracking-[-0.02em] font-light text-gray-800">
                Rakshitha&apos;s
              </span>
              <span className="text-2xl text-gray-500 mt-6 font-light tracking-wide">
                Echoes of shared time.
              </span>
            </motion.div>
          </motion.div>

          <div className="w-full flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </motion.div>
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
    <div className="h-screen overflow-hidden bg-white">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] bg-noise" />
      
      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => setShowOnlyMedia(!showOnlyMedia)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-white/80 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white transition-colors duration-200 group md:left-8 md:-translate-x-0"
      >
        <span className="text-lg transition-transform duration-200 group-hover:scale-110">✍️</span>
        <div className="h-5 w-9 rounded-full relative bg-gray-200 transition-colors duration-200" style={{ backgroundColor: showOnlyMedia ? '#e5e7eb' : '#d1d5db' }}>
          <motion.div 
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-gray-600"
            animate={{ x: showOnlyMedia ? 16 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>

      <div className="h-full flex relative">
        {/* Mobile Title Section */}
        <div className="md:hidden fixed top-0 inset-x-0 z-10 bg-white/95 backdrop-blur-sm">
          <div className="px-6 pt-6 pb-2 text-center">
            <h1 className="text-3xl tracking-[-0.02em] font-light text-gray-800">
              Keerthi & Rakshitha&apos;s
            </h1>
            <p className="text-xl text-gray-500 mt-0.5 mb-2 font-light tracking-wide">
              Echoes of shared time.
            </p>
          </div>
        </div>

        {/* Desktop Title Section */}
        <motion.div 
          className="fixed left-16 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden md:block"
          style={{ opacity: titleOpacity }}
          initial={{ opacity: 1 }}
        >
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-[56px] leading-tight tracking-[-0.02em] font-light text-gray-800">
              Keerthi &
            </span>
            <span className="text-[56px] leading-tight tracking-[-0.02em] font-light text-gray-800">
              Rakshitha&apos;s
            </span>
            <span className="text-2xl text-gray-500 mt-6 font-light tracking-wide">
              Echoes of shared time.
            </span>
          </motion.div>
        </motion.div>

        {/* Timeline Section */}
        <div className="w-full flex items-center">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory h-full items-center min-w-0 md:pl-[33vw] pt-20 md:pt-0"
          >
            <div className="flex gap-24 pr-24 pl-[calc(50vw-125px)] md:pl-0">
              {filteredMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 80,
                    delay: index * 0.1,
                    duration: 0.8
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="flex-none snap-center relative"
                >
                  <div className="w-[250px] flex flex-col items-center">
                    {memory.media && memory.media.length > 0 ? (
                      <motion.div 
                        className="relative h-[400px] cursor-pointer perspective-1000"
                        whileHover="hover"
                        initial="initial"
                        animate="initial"
                        onClick={() => handleSelectMemory(memory)}
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
                            <div className="relative w-full h-full">
                              <ImageWithFallback
                                src={getStorageUrl(memory.media[2].url)}
                                alt={memory.title}
                                width={800}
                                height={1000}
                                className="w-full h-full object-cover transition-all duration-500 group-hover:filter-none filter grayscale"
                                unoptimized
                                quality={85}
                              />
                            </div>
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
                            <div className="relative w-full h-full">
                              <ImageWithFallback
                                src={getStorageUrl(memory.media[1].url)}
                                alt={memory.title}
                                width={800}
                                height={1000}
                                className="w-full h-full object-cover transition-all duration-500 group-hover:filter-none filter grayscale"
                                unoptimized
                                quality={85}
                              />
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Main Image Card */}
                        <motion.div 
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] aspect-[4/5] bg-white rounded-xl shadow-[0_16px_24px_-8px_rgba(0,0,0,0.3)] overflow-hidden group transform-gpu md:hover:-translate-y-2 hover:-translate-y-10 md:z-10 z-20"
                          variants={{
                            initial: { scale: 1, rotate: 0, x: "-50%" },
                            hover: { 
                              scale: 1.15,
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
                            {memory.media[0].type === 'video' ? (
                              <video
                                src={getStorageUrl(memory.media[0].url)}
                                className="w-full h-full object-cover transition-all duration-500 group-hover:filter-none filter grayscale"
                                controls={false}
                                playsInline
                                muted
                                loop
                              />
                            ) : (
                              <ImageWithFallback
                                src={getStorageUrl(memory.media[0].url)}
                                alt={memory.title}
                                width={800}
                                height={1000}
                                className="w-full h-full object-cover transition-all duration-500 group-hover:filter-none filter grayscale"
                                unoptimized
                                quality={85}
                                priority={index < 4}
                              />
                            )}
                          </div>
                        </motion.div>

                        {/* Connecting Line */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-[60px] bg-gray-300" />
                      </motion.div>
                    ) : (
                      // Card UI for memories without media
                      <div className="relative h-[400px]">
                        <div className="w-[250px] aspect-[4/5] bg-white rounded-xl shadow-[0_8px_16px_-8px_rgba(0,0,0,0.2)] overflow-hidden">
                          <div className="h-full flex flex-col">
                            {/* Card Header with Emoji */}
                            <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <span className="text-gray-600">{memory.emoji || '✍️'}</span>
                              </div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="flex-1 p-6 flex flex-col items-center justify-center">
                              <p className="text-gray-600 text-center font-light leading-relaxed">
                                {memory.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Connecting Line */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-[60px] bg-gray-300" />
                      </div>
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
                      {formatDate(memory.date)}
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
