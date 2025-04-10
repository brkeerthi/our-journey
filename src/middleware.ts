import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession()

    // If the user is not signed in and the current path starts with /admin
    // but is not the login page, redirect them to the login page
    if (!session && 
        request.nextUrl.pathname.startsWith('/admin') && 
        !request.nextUrl.pathname.startsWith('/admin/login')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      return NextResponse.redirect(redirectUrl)
    }

    // If the user is signed in and trying to access the login page,
    // redirect them to the admin dashboard
    if (session && request.nextUrl.pathname.startsWith('/admin/login')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin'
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    // If there's an error checking the session, redirect to login
    if (request.nextUrl.pathname.startsWith('/admin') && 
        !request.nextUrl.pathname.startsWith('/admin/login')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 