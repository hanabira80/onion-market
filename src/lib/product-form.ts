import {
  isCategory,
  isCondition,
  isSaleStatus,
  type ProductCategory,
  type ProductCondition,
  type SaleStatus,
} from "@/lib/catalog"
import type { ProductInput } from "@/lib/products"

export function parseProductFields(
  formData: FormData,
  imageUrl: string | null
): ProductInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { error: "상품 이름을 적어 주세요." }
  }

  const condition = String(formData.get("condition") ?? "")
  if (!isCondition(condition)) {
    return { error: "컨디션을 골라 주세요." }
  }

  const saleStatus = String(formData.get("saleStatus") ?? "")
  if (!isSaleStatus(saleStatus)) {
    return { error: "판매 상태를 골라 주세요." }
  }

  const category = String(formData.get("category") ?? "")
  if (!isCategory(category)) {
    return { error: "카테고리를 골라 주세요." }
  }

  const points = Number(formData.get("points"))
  if (!Number.isInteger(points) || points < 1) {
    return { error: "구매 포인트는 1 이상 정수여야 해요." }
  }

  const quantity = Number(formData.get("quantity"))
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: "수량은 0 이상 정수여야 해요." }
  }

  return {
    name,
    imageUrl,
    condition: condition as ProductCondition,
    saleStatus: saleStatus as SaleStatus,
    category: category as ProductCategory,
    points,
    quantity,
  }
}
