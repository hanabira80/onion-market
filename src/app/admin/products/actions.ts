"use server"

import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth"
import { parseProductFields } from "@/lib/product-form"
import { createProduct, deleteProduct, getProductById, updateProduct } from "@/lib/products"
import { saveProductImage } from "@/lib/uploads"

export type ProductActionState = { error: string } | undefined

async function resolveImage(formData: FormData, currentUrl: string | null) {
  const file = formData.get("image")

  if (!(file instanceof File) || file.size === 0) {
    return currentUrl
  }

  return saveProductImage(file)
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin()

  const image = await resolveImage(formData, null)
  if (image && typeof image === "object" && "error" in image) {
    return { error: image.error }
  }
  if (!image) {
    return { error: "대표 사진을 올려 주세요." }
  }

  const parsed = parseProductFields(formData, image)
  if ("error" in parsed) {
    return parsed
  }

  await createProduct(parsed)
  redirect("/admin/products")
}

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin()

  const id = String(formData.get("id") ?? "")
  const current = await getProductById(id)
  if (!current) {
    return { error: "상품을 찾지 못했어요." }
  }

  const image = await resolveImage(formData, current.imageUrl)
  if (image && typeof image === "object" && "error" in image) {
    return { error: image.error }
  }

  const parsed = parseProductFields(formData, image)
  if ("error" in parsed) {
    return parsed
  }

  await updateProduct(id, parsed)
  redirect("/admin/products")
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  await deleteProduct(id)
  redirect("/admin/products")
}
