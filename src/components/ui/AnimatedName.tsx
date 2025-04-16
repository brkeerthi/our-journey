import { useState, useRef } from 'react'
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
  const [currentNameIndex, setCurrentNameIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  const handleHoverStart = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsHovering(true)
    intervalRef.current = setInterval(() => {
      setCurrentNameIndex((prev) => (prev + 1) % names.length)
    }, 1200)
  }

  const handleHoverEnd = () => {
    setIsHovering(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    setCurrentNameIndex(0)
  }

  return (
    <motion.span
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className="inline-block relative cursor-pointer select-none font-gilda"
      animate={{ 
        color: isHovering ? '#db2777' : '#1f2937'
      }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={names[currentNameIndex]}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1]
          }}
          className="inline-block font-gilda"
          style={{ fontSize: 'inherit', lineHeight: 'inherit', letterSpacing: 'inherit' }}
        >
          {names[currentNameIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
} 