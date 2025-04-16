'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LayoutDashboard, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function AdminNav({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && pathname !== '/admin/login') {
        router.push('/admin/login')
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth, pathname])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-semibold text-gray-900">Our Journey</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <LayoutDashboard className="mr-3 h-5 w-5 text-gray-500" />
              Dashboard
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg w-full"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-500" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex-1">
        {children}
      </div>
    </div>
  )
} 