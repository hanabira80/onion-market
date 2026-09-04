import { createServiceClient, throwIfError } from "@/lib/supabase"

export const ORDER_STATUSES = ["awaiting_pickup", "completed", "cancelled"] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_pickup: "수령 대기",
  completed: "수령 완료",
  cancelled: "취소",
}

export type OrderRecord = {
  id: string
  studentId: string
  productId: string
  productName: string
  productImageUrl: string | null
  points: number
  quantity: 1
  status: OrderStatus
  createdAt: string
}

export type PurchaseFailureCode =
  | "not_found"
  | "sold_out"
  | "not_on_sale"
  | "insufficient"

export type PurchaseResult =
  | {
      ok: true
      order: OrderRecord
      remainingPoints: number
      remainingQuantity: number
    }
  | { ok: false; code: PurchaseFailureCode; error: string }

export type CancelFailureCode = "not_found" | "not_cancellable"

export type CancelResult =
  | {
      ok: true
      order: OrderRecord
      remainingPoints: number
      productId: string
    }
  | { ok: false; code: CancelFailureCode; error: string }

export function formatOrderTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

type OrderRow = {
  id: string
  student_id: string
  product_id: string | null
  product_name: string
  product_image_url: string | null
  points: number
  quantity: number
  status: OrderStatus
  created_at: string
}

function mapOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    productId: row.product_id ?? "",
    productName: row.product_name,
    productImageUrl: row.product_image_url,
    points: row.points,
    quantity: 1,
    status: row.status,
    createdAt: row.created_at,
  }
}

function asOrderRow(value: unknown): OrderRow | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const row = value as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.student_id !== "string") {
    return null
  }
  return {
    id: row.id,
    student_id: row.student_id,
    product_id: typeof row.product_id === "string" ? row.product_id : null,
    product_name: String(row.product_name ?? ""),
    product_image_url:
      typeof row.product_image_url === "string" ? row.product_image_url : null,
    points: Number(row.points),
    quantity: Number(row.quantity),
    status: row.status as OrderStatus,
    created_at: String(row.created_at ?? ""),
  }
}

export async function listOrdersByStudent(studentId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  throwIfError(error)
  return ((data ?? []) as OrderRow[]).map(mapOrder)
}

export async function listOrders(status?: OrderStatus) {
  const supabase = createServiceClient()
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false })
  if (status) {
    query = query.eq("status", status)
  }
  const { data, error } = await query
  throwIfError(error)
  return ((data ?? []) as OrderRow[]).map(mapOrder)
}

export async function countOrdersByStatus(status: OrderStatus) {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", status)
  throwIfError(error)
  return count ?? 0
}

export async function purchaseProduct(
  studentId: string,
  productId: string
): Promise<PurchaseResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("purchase_product", {
    p_student_id: studentId,
    p_product_id: productId,
  })
  throwIfError(error)

  const result = data as {
    ok?: boolean
    code?: PurchaseFailureCode
    error?: string
    remaining_points?: number
    remaining_quantity?: number
    order?: unknown
  }

  if (!result?.ok) {
    return {
      ok: false,
      code: result?.code ?? "not_found",
      error: result?.error ?? "상품을 찾지 못했어요.",
    }
  }

  const order = asOrderRow(result.order)
  if (!order) {
    return { ok: false, code: "not_found", error: "상품을 찾지 못했어요." }
  }

  return {
    ok: true,
    order: mapOrder(order),
    remainingPoints: Number(result.remaining_points),
    remainingQuantity: Number(result.remaining_quantity),
  }
}

export async function cancelOrder(
  studentId: string,
  orderId: string
): Promise<CancelResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("cancel_order", {
    p_student_id: studentId,
    p_order_id: orderId,
  })
  throwIfError(error)

  const result = data as {
    ok?: boolean
    code?: CancelFailureCode
    error?: string
    remaining_points?: number
    product_id?: string | null
    order?: unknown
  }

  if (!result?.ok) {
    return {
      ok: false,
      code: result?.code ?? "not_found",
      error: result?.error ?? "주문을 찾지 못했어요.",
    }
  }

  const order = asOrderRow(result.order)
  if (!order) {
    return { ok: false, code: "not_found", error: "주문을 찾지 못했어요." }
  }

  return {
    ok: true,
    order: mapOrder(order),
    remainingPoints: Number(result.remaining_points),
    productId: String(result.product_id ?? order.product_id ?? ""),
  }
}

export type CompleteFailureCode = "not_found" | "not_completable"

export type CompleteResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; code: CompleteFailureCode; error: string }

export async function completeOrder(orderId: string): Promise<CompleteResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("complete_order", {
    p_order_id: orderId,
  })
  throwIfError(error)

  const result = data as {
    ok?: boolean
    code?: CompleteFailureCode
    error?: string
    order?: unknown
  }

  if (!result?.ok) {
    return {
      ok: false,
      code: result?.code ?? "not_found",
      error: result?.error ?? "주문을 찾지 못했어요.",
    }
  }

  const order = asOrderRow(result.order)
  if (!order) {
    return { ok: false, code: "not_found", error: "주문을 찾지 못했어요." }
  }

  return { ok: true, order: mapOrder(order) }
}
