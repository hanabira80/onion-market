import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { exchangeGoogleCode, OAUTH_VERIFIER_COOKIE } from "@/lib/google-auth"
import { createSession } from "@/lib/session"
import { getTeacherAccess } from "@/lib/staff"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const jar = await cookies()
  const verifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value

  jar.delete(OAUTH_VERIFIER_COOKIE)

  if (!code || !verifier) {
    redirect("/login?teacher=failed")
  }

  const googleUser = await exchangeGoogleCode(code, verifier)

  if (!googleUser) {
    redirect("/login?teacher=failed")
  }

  const access = await getTeacherAccess(googleUser.email)

  if (!access) {
    redirect("/login?teacher=denied")
  }

  await createSession({
    kind: "teacher",
    email: access.email,
    name: googleUser.name,
    role: "admin",
    adminLevel: access.level,
  })

  redirect("/admin")
}
