import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/feed'];
const AUTH_ONLY = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('auth_presence');

  if (PROTECTED.some(p => pathname.startsWith(p)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (AUTH_ONLY.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
