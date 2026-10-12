"use server"

import { revalidatePath } from "next/cache"

import { requireMaster } from "@/lib/auth"
import { addSubAdmin, removeSubAdmin } from "@/lib/staff"

export type StaffState = { error: string } | { ok: true } | undefined

export async function addSubAdminAction(
  _prev: StaffState,
  formData: FormData
): Promise<StaffState> {
  await requireMaster()

  const result = await addSubAdmin(String(formData.get("email") ?? ""))

  if ("error" in result && result.error) {
    return { error: result.error }
  }

  revalidatePath("/admin/staff")
  return { ok: true }
}

export async function removeSubAdminAction(formData: FormData) {
  await requireMaster()
  await removeSubAdmin(String(formData.get("email") ?? ""))
  revalidatePath("/admin/staff")
}
