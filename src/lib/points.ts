import { createServiceClient, throwIfError } from "@/lib/supabase"

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

export async function listPointLedger(limit = 30) {
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
