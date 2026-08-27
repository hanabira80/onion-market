"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth"
import { completeOrder } from "@/lib/orders"

export type AdminOrderState = { error: string } | undefined

export async function completeOrderAction(
  _prev: AdminOrderState,
  formData: FormData
): Promise<AdminOrderState> {
  await requireAdmin()
  const orderId = String(formData.get("orderId") ?? "")

  if (!orderId) {
    return { error: "주문을 찾지 못했어요." }
  }

  const result = await completeOrder(orderId)

  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/me")
  revalidatePath("/me/orders")
  redirect("/admin/orders?completed=1")
}
