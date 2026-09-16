import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES, homeForRole } from '@/lib/routes';
import { TOKEN_COOKIE, decodeToken } from '@/lib/token';
import { EXECUTIVE_ROLES, ROLES } from '@/types';

/**
 * Edge-side route protection (Next.js 16 "proxy", formerly middleware).
 *
 * This is the FRONTEND half of RBAC: it keeps borrowers out of /dashboard and
 * executives out of /portal, and bounces anonymous users to /login. It only
 * decodes the JWT — the API independently verifies and authorizes every call.
 */
const PUBLIC_ROUTES = [ROUTES.login, ROUTES.register];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? decodeToken(token) : null;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Anonymous user on a protected page → login (remember where they wanted to go).
  if (!payload && !isPublic) {
    const loginUrl = new URL(ROUTES.login, request.url);
    if (pathname !== ROUTES.home) loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(TOKEN_COOKIE); // expired/garbage token
    return response;
  }

  if (payload) {
    const home = homeForRole(payload.role);

    // Logged-in user visiting login/register or the root → their home.
    if (isPublic || pathname === ROUTES.home) {
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Borrowers may not open the dashboard; executives may not open the portal.
    const isBorrower = payload.role === ROLES.BORROWER;
    const isExecutive = EXECUTIVE_ROLES.includes(payload.role);
    if (
      (pathname.startsWith(ROUTES.dashboard) && !isExecutive) ||
      (pathname.startsWith(ROUTES.portal) && !isBorrower)
    ) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
