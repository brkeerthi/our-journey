'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Image as ImageIcon, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (!session) {
          router.push('/login')
          return
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('Auth error:', err)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden border-r bg-gray-100/40 lg:block lg:w-64">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/admin" className="flex items-center font-semibold">
              Our Journey
            </Link>
          </div>
          <div className="flex-1 space-y-1 p-2">
            <Link href="/admin">
              <Button
                variant={pathname === '/admin' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/memories">
              <Button
                variant={pathname.includes('/admin/memories') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                All Memories
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button
                variant={pathname === '/admin/settings' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
          <div className="border-t p-2">
            <form action="/auth/signout" method="post">
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
} 