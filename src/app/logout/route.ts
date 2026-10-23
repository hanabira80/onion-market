import { NextResponse } from "next/server"

import { SESSION_COOKIE, SETUP_COOKIE } from "@/lib/session"

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url))
  const expired = { path: "/", maxAge: 0 }
  response.cookies.set(SESSION_COOKIE, "", expired)
  response.cookies.set(SETUP_COOKIE, "", expired)
  return response
}
