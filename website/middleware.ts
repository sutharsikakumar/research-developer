// website/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Runs on every request that matches `config.matcher`
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 1 · Attach cookies from the incoming request so Supabase can read the session
  const supabase = createMiddlewareClient({ req, res })

  // 2 · Fetch the current session (if any)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 3 · Allow public assets & the wait‑list page itself
  const { pathname } = req.nextUrl
  if (
    pathname.startsWith('/waitlist') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/_next')
  ) {
    return res
  }

  // 4 · No session? → send them to the wait‑list form
  if (!session) {
    return NextResponse.redirect(new URL('/waitlist', req.url))
  }

  // 5 · Lookup the user in your “waitlist‑beta” table
  const { data, error } = await supabase
    .from('waitlist-beta')
    .select('approved')
    .eq('email', session.user.email)
    .single()

  // 6 · If they’re not approved yet, keep them on the wait‑list page
  if (error || !data?.approved) {
    return NextResponse.redirect(new URL('/waitlist', req.url))
  }

  // 7 · Everything OK → continue to the requested page
  return res
}

// Apply the middleware to the home page and everything except /_next/*
export const config = {
  matcher: ['/', '/((?!_next/).*)'],
}
