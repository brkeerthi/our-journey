import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // If user is on /login, redirect to /admin/login
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // If accessing admin pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page when not authenticated
    if (request.nextUrl.pathname === '/admin/login') {
      if (session) {
        // If already logged in, redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      // Allow access to login page
      return response
    }

    // For all other admin routes, require authentication
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login']
} 