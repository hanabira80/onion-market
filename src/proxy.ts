import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE, readSessionFromToken } from "@/lib/session"

const PUBLIC_PREFIXES = ["/login", "/logout"]

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await readSessionFromToken(
    request.cookies.get(SESSION_COOKIE)?.value
  )

  if (session && isPublicPath(pathname) && pathname !== "/logout") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const isBootstrapImport = pathname === "/admin/students/import"

  if (!session && !isPublicPath(pathname) && !isBootstrapImport) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
