import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // If trying to access admin pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If accessing login page while authenticated
  if (request.nextUrl.pathname === '/login' && session) {
    // Redirect to admin dashboard if already logged in
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/login']
} 