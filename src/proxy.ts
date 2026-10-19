import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/" || pathname === "/spooky-onion.lottie") {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|spooky-onion\\.lottie|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
