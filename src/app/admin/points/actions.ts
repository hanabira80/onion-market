"use server"

import { requireAdmin } from "@/lib/auth"
import { grantPoints } from "@/lib/points"

export type GrantState =
  | { error: string }
  | { ok: true; granted: number; missing: string[] }
  | undefined

export async function grantPointsAction(
  _prev: GrantState,
  formData: FormData
): Promise<GrantState> {
  const admin = await requireAdmin()

  if (!admin) {
    return { error: "관리자로 다시 로그인해 주세요." }
  }

  const amount = Number(formData.get("amount"))
  if (!Number.isInteger(amount) || amount < 1) {
    return { error: "포인트는 1 이상 정수여야 해요." }
  }

  const memo = String(formData.get("memo") ?? "").trim()
  if (!memo) {
    return { error: "지급 이유를 짧게 적어 주세요." }
  }

  const selected = formData
    .getAll("studentIds")
    .map((value) => String(value).trim())
    .filter(Boolean)

  if (selected.length === 0) {
    return { error: "포인트를 줄 학생을 선택해 주세요." }
  }

  const result = await grantPoints({
    studentIds: selected,
    amount,
    memo,
    grantedBy: admin.studentId,
  })

  if (result.found.length === 0) {
    return { error: "선택한 학번이 명단에 없어요." }
  }

  return {
    ok: true,
    granted: result.found.length,
    missing: result.missing,
  }
}
