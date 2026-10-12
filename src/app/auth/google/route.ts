import { NextResponse } from "next/server"

import { buildGoogleAuthUrl, isGoogleAuthConfigured, OAUTH_VERIFIER_COOKIE } from "@/lib/google-auth"

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?teacher=unconfigured", request.url))
  }

  const origin = new URL(request.url).origin
  const { url, verifier } = await buildGoogleAuthUrl(`${origin}/auth/callback`)
  const response = NextResponse.redirect(url)

  response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })

  return response
}
