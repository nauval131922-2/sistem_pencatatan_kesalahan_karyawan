import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

// Tentukan rute yang tidak memerlukan autentikasi
const publicRoutes = ['/login'];
// Tentukan pola rute yang selalu bisa diakses (aset statis, api tertentu opsional)
const publicPathPrefixes = ['/_next', '/favicon.ico', '/api/auth'];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Izinkan akses ke rute publik dan statis
  const isPublicRoute = publicRoutes.includes(path);
  const isPublicPrefix = publicPathPrefixes.some(prefix => path.startsWith(prefix));

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // Cek session
  const session = await getSession();

  // Jika tidak ada session dan mencoba akses rute terproteksi, arahkan ke login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika ada session, izinkan akses
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, but we handle auth inside or above)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
