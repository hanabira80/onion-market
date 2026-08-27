export const CONDITIONS = ["good", "fair", "poor"] as const
export const SALE_STATUSES = ["on_sale", "reserved", "done"] as const
export const CATEGORIES = ["stationery", "supplies", "fashion", "other"] as const

export type ProductCondition = (typeof CONDITIONS)[number]
export type SaleStatus = (typeof SALE_STATUSES)[number]
export type ProductCategory = (typeof CATEGORIES)[number]

export const CONDITION_LABEL: Record<ProductCondition, string> = {
  good: "상",
  fair: "중",
  poor: "하",
}

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  on_sale: "판매중",
  reserved: "예약",
  done: "완료",
}

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  stationery: "문구",
  supplies: "학용품",
  fashion: "패션",
  other: "기타",
}

export function isCondition(value: string): value is ProductCondition {
  return (CONDITIONS as readonly string[]).includes(value)
}

export function isSaleStatus(value: string): value is SaleStatus {
  return (SALE_STATUSES as readonly string[]).includes(value)
}

export function isCategory(value: string): value is ProductCategory {
  return (CATEGORIES as readonly string[]).includes(value)
}

export function canPurchase(status: SaleStatus, quantity: number) {
  return status === "on_sale" && quantity > 0
}

export function compareShopProducts<
  T extends { saleStatus: SaleStatus; quantity: number; createdAt: string },
>(a: T, b: T) {
  const aReady = canPurchase(a.saleStatus, a.quantity) ? 0 : 1
  const bReady = canPurchase(b.saleStatus, b.quantity) ? 0 : 1

  if (aReady !== bReady) {
    return aReady - bReady
  }

  return b.createdAt.localeCompare(a.createdAt)
}
