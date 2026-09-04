import { createClient } from "@supabase/supabase-js"

const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "onion_market"

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set.`)
  }
  return value
}

export function getSupabaseSchema() {
  return SCHEMA
}

export function createBrowserClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      db: { schema: SCHEMA },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

export function createServiceClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      db: { schema: SCHEMA },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

export function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message)
  }
}
