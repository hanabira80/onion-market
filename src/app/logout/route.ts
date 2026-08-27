import { NextResponse } from "next/server"

import { SESSION_COOKIE, SETUP_COOKIE } from "@/lib/session"

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url))
  response.cookies.delete(SESSION_COOKIE)
  response.cookies.delete(SETUP_COOKIE)
  return response
}
