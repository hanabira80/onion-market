"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireStudent } from "@/lib/auth"
import { cancelOrder } from "@/lib/orders"

export type MeActionState = { error: string } | undefined

export async function cancelOrderAction(
  _prev: MeActionState,
  formData: FormData
): Promise<MeActionState> {
  const student = await requireStudent()
  const orderId = String(formData.get("orderId") ?? "")

  if (!orderId) {
    return { error: "주문을 찾지 못했어요." }
  }

  const result = await cancelOrder(student.studentId, orderId)

  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath("/")
  revalidatePath("/me")
  revalidatePath("/me/orders")
  revalidatePath(`/products/${result.productId}`)
  redirect("/me/orders?cancelled=1")
}
