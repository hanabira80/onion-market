"use server"

import { requireAdmin } from "@/lib/auth"
import { parseStudentCsv } from "@/lib/csv"
import { upsertStudents } from "@/lib/roster"

export type ImportState =
  | { error: string }
  | { ok: true; created: number; updated: number; total: number }
  | undefined

export async function importStudentsCsv(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  await requireAdmin()

  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return { error: "CSV 파일을 선택해 주세요." }
  }

  const text = await file.text()
  const parsed = parseStudentCsv(text)

  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const result = await upsertStudents(parsed.rows)

  return {
    ok: true,
    created: result.created,
    updated: result.updated,
    total: result.total,
  }
}
