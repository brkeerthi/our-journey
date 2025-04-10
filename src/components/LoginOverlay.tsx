import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LoginOverlayProps {
  onAuthenticated: () => void
}

export default function LoginOverlay({ onAuthenticated }: LoginOverlayProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password === '26012025') {
      setError(false)
      setIsAnimatingOut(true)
      localStorage.setItem('authenticated', 'true')
      
      // Delay the onAuthenticated callback to allow for animation
      setTimeout(() => {
        onAuthenticated()
      }, 500)
    } else {
      setError(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isAnimatingOut ? 0 : 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{ 
            scale: isAnimatingOut ? 0.9 : 1,
            opacity: isAnimatingOut ? 0 : 1
          }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-sm p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light tracking-tight text-gray-900">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500">
                Please enter the password to continue
              </p>
            </div>

            <div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(false)
                  }}
                  className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                    error ? 'ring-red-300' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-center tracking-[0.2em]`}
                  placeholder="••••••"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 text-center"
                >
                  Incorrect password
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-light text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Continue
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 