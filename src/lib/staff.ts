import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import { createServiceClient, isSupabaseConfigured, throwIfError } from "@/lib/supabase"

export type SubAdmin = {
  email: string
  createdAt: string
}

type SubAdminRow = {
  email: string
  created_at: string
}

const FILE = "sub-admins.json"

export function masterAdminEmail() {
  return (process.env.MASTER_ADMIN_EMAIL || "hanabira80@gmail.com").trim().toLowerCase()
}

export function normalizeEmail(raw: string) {
  const email = raw.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null
  }

  return email
}

function mapRow(row: SubAdminRow): SubAdmin {
  return {
    email: row.email,
    createdAt: row.created_at,
  }
}

function missingTable(error: { message: string; code?: string } | null) {
  if (!error) {
    return false
  }

  return error.code === "42P01" || error.code === "PGRST205" || error.message.includes("sub_admins")
}

async function readAllLocal(): Promise<SubAdmin[]> {
  const parsed = await readJsonFile<SubAdmin[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listSubAdmins() {
  if (!isSupabaseConfigured()) {
    const rows = await readAllLocal()
    return rows.sort((a, b) => a.email.localeCompare(b.email))
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("sub_admins")
    .select("email, created_at")
    .order("email", { ascending: true })

  if (missingTable(error)) {
    return []
  }

  throwIfError(error)
  return ((data ?? []) as SubAdminRow[]).map(mapRow)
}

export async function getTeacherAccess(email: string) {
  const normalized = email.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  if (normalized === masterAdminEmail()) {
    return { email: normalized, level: "master" as const }
  }

  const subs = await listSubAdmins()
  const found = subs.some((row) => row.email === normalized)

  if (!found) {
    return null
  }

  return { email: normalized, level: "sub" as const }
}

export async function addSubAdmin(
  rawEmail: string
): Promise<{ error: string } | { ok: true }> {
  const email = normalizeEmail(rawEmail)

  if (!email) {
    return { error: "메일 주소를 확인해 주세요." as const }
  }

  if (email === masterAdminEmail()) {
    return { error: "메인 마스터는 따로 추가하지 않아도 돼요." as const }
  }

  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const rows = await readAllLocal()

      if (rows.some((row) => row.email === email)) {
        return { error: "이미 선생님 명단에 있어요." as const }
      }

      rows.push({ email, createdAt: new Date().toISOString() })
      await writeJsonFile(FILE, rows)
      return { ok: true as const }
    })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("sub_admins").insert({ email })

  if (missingTable(error)) {
    return { error: "서브 관리자 표가 아직 없어요." as const }
  }

  if (error?.code === "23505") {
    return { error: "이미 선생님 명단에 있어요." as const }
  }

  throwIfError(error)
  return { ok: true as const }
}

export async function removeSubAdmin(rawEmail: string) {
  const email = normalizeEmail(rawEmail)

  if (!email || email === masterAdminEmail()) {
    return
  }

  if (!isSupabaseConfigured()) {
    await withLock(async () => {
      const rows = await readAllLocal()
      await writeJsonFile(
        FILE,
        rows.filter((row) => row.email !== email)
      )
    })
    return
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("sub_admins").delete().eq("email", email)

  if (missingTable(error)) {
    return
  }

  throwIfError(error)
}
