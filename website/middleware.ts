// website/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'  // ✅ root path
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  if (
    pathname.startsWith('/waitlist') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/_next')
  ) return res

  if (!session) return NextResponse.redirect(new URL('/waitlist', req.url))

  const { data, error } = await supabase
    .from('waitlist-beta')
    .select('approved')
    .eq('email', session.user.email)
    .single()

  if (error || !data?.approved)
    return NextResponse.redirect(new URL('/waitlist', req.url))

  return res
}

export const config = { matcher: ['/', '/((?!_next/).*)'] }
