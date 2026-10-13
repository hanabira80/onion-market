"use server"

import { requireAdmin } from "@/lib/auth"
import { parseStudentCsv } from "@/lib/csv"
import { upsertStudents } from "@/lib/roster"
import { parseStudentWorkbook } from "@/lib/xlsx-roster"

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
    return { error: "엑셀 파일을 선택해 주세요." }
  }

  const filename = file.name.toLowerCase()
  const parsed = filename.endsWith(".xlsx")
    ? await parseStudentWorkbook(await file.arrayBuffer())
    : filename.endsWith(".csv")
      ? parseStudentCsv(await file.text())
      : { ok: false as const, error: "엑셀(.xlsx) 파일을 올려 주세요." }

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
