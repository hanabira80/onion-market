"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireStudent } from "@/lib/auth"
import { purchaseProduct } from "@/lib/orders"
import { getProductById } from "@/lib/products"
import { toggleWishlist } from "@/lib/wishlist"

export type ShopActionState = { error: string } | undefined

export async function toggleWishlistAction(productId: string) {
  const student = await requireStudent()

  if (!productId) {
    return
  }

  const product = await getProductById(productId)
  if (!product) {
    return
  }

  await toggleWishlist(student.studentId, productId)
  revalidatePath("/")
  revalidatePath(`/products/${productId}`)
  revalidatePath("/me")
  revalidatePath("/me/wishlist")
}

export async function purchaseProductAction(
  _prev: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  const student = await requireStudent()
  const productId = String(formData.get("productId") ?? "")

  if (!productId) {
    return { error: "상품을 찾지 못했어요." }
  }

  const result = await purchaseProduct(student.studentId, productId)

  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath("/")
  revalidatePath(`/products/${productId}`)
  revalidatePath("/me")
  revalidatePath("/me/orders")
  redirect(`/products/${productId}?purchased=1`)
}
