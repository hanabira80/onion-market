import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import { addPointsToStudents } from "@/lib/roster"

export type PointLedgerEntry = {
  id: string
  studentId: string
  amount: number
  memo: string
  grantedBy: string
  createdAt: string
}

const FILE = "point-ledger.json"

async function readLedger(): Promise<PointLedgerEntry[]> {
  const parsed = await readJsonFile<PointLedgerEntry[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listPointLedger(limit = 30) {
  const entries = await readLedger()
  return entries
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function grantPoints(args: {
  studentIds: string[]
  amount: number
  memo: string
  grantedBy: string
}) {
  const result = await addPointsToStudents(args.studentIds, args.amount)

  if (result.found.length === 0) {
    return result
  }

  await withLock(async () => {
    const ledger = await readLedger()
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
