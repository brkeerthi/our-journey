import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const names = [
  "Rakshitha",
  "Baby bangara",
  "Kullamma",
  "Motamma",
  "SP",
  "SS"
]

export function AnimatedName() {
  const [isHovered, setIsHovered] = useState(false)
  const [currentNameIndex, setCurrentNameIndex] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined

    if (isHovered) {
      // Start cycling through names when hovered
      interval = setInterval(() => {
        setCurrentNameIndex((prev) => (prev + 1) % names.length)
      }, 1200) // Slower name change (1.2 seconds)
    } else {
      // Immediately reset to Rakshitha when not hovered
      setCurrentNameIndex(0)
    }

    // Cleanup function to clear interval
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isHovered])

  const handleHoverEnd = () => {
    setIsHovered(false)
    setCurrentNameIndex(0) // Immediately reset to first name
  }

  return (
    <motion.span
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={handleHoverEnd}
      onMouseLeave={handleHoverEnd}
      className="inline-block relative cursor-pointer select-none hover:text-pink-600 transition-colors duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={names[currentNameIndex]}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="inline-block"
        >
          {names[currentNameIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
} 