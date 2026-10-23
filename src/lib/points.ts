import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import { addPointsToStudents, getStudentById } from "@/lib/roster"
import { createServiceClient, isSupabaseConfigured, throwIfError } from "@/lib/supabase"

export type PointLedgerEntry = {
  id: string
  studentId: string
  amount: number
  memo: string
  grantedBy: string
  createdAt: string
}

type LedgerRow = {
  id: string
  student_id: string
  amount: number
  memo: string
  granted_by: string
  created_at: string
}

const FILE = "point-ledger.json"

function mapEntry(row: LedgerRow): PointLedgerEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    amount: row.amount,
    memo: row.memo,
    grantedBy: row.granted_by,
    createdAt: row.created_at,
  }
}

async function readLedgerLocal(): Promise<PointLedgerEntry[]> {
  const parsed = await readJsonFile<PointLedgerEntry[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listPointLedger(limit = 30) {
  if (!isSupabaseConfigured()) {
    const entries = await readLedgerLocal()
    return entries
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("point_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  throwIfError(error)
  return ((data ?? []) as LedgerRow[]).map(mapEntry)
}

export async function grantPoints(args: {
  studentIds: string[]
  amount: number
  memo: string
  grantedBy: string
}) {
  if (!isSupabaseConfigured()) {
    const result = await addPointsToStudents(args.studentIds, args.amount)

    if (result.found.length === 0) {
      return result
    }

    await withLock(async () => {
      const ledger = await readLedgerLocal()
      const now = new Date().toISOString()
      const entries = result.found.map((studentId) => ({
        id: crypto.randomUUID(),
        studentId,
        amount: args.amount,
        memo: args.memo,
        grantedBy: args.grantedBy,
        createdAt: now,
      }))
      await writeJsonFile(FILE, [...ledger, ...entries])
    })

    return result
  }

  const supabase = createServiceClient()
  const uniqueIds = [...new Set(args.studentIds)]
  const { data, error } = await supabase.rpc("grant_points", {
    p_student_ids: uniqueIds,
    p_amount: args.amount,
    p_memo: args.memo,
    p_granted_by: args.grantedBy,
  })
  throwIfError(error)

  const result = data as { found?: string[]; missing?: string[] } | null
  return {
    found: result?.found ?? [],
    missing: result?.missing ?? [],
  }
}

export async function setStudentPoints(studentId: string, amount: number) {
  const student = await getStudentById(studentId)
  if (!student) {
    return false
  }

  const delta = amount - student.pointsBalance
  if (delta === 0) {
    return true
  }

  const result = await grantPoints({
    studentIds: [studentId],
    amount: delta,
    memo: "오늘 받은 포인트",
    grantedBy: studentId,
  })

  return result.found.includes(studentId)
}
