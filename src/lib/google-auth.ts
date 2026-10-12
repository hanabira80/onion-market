export const OAUTH_VERIFIER_COOKIE = "onion_oauth_verifier"

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function buildGoogleAuthUrl(redirectTo: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  const challenge = Buffer.from(digest).toString("base64url")
  const url = new URL(`${supabaseUrl}/auth/v1/authorize`)

  url.searchParams.set("provider", "google")
  url.searchParams.set("redirect_to", redirectTo)
  url.searchParams.set("code_challenge", challenge)
  url.searchParams.set("code_challenge_method", "s256")
  url.searchParams.set("scopes", "email profile")

  return { url: url.toString(), verifier }
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return null
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    user?: { email?: string; user_metadata?: { full_name?: string; name?: string } }
  }
  const email = data.user?.email?.trim().toLowerCase() ?? ""

  if (!email) {
    return null
  }

  const meta = data.user?.user_metadata
  const name = meta?.full_name || meta?.name || email

  return { email, name }
}
