import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import type { PointLedgerEntry } from "@/lib/points"
import type { ProductRecord } from "@/lib/products"
import type { StudentRecord } from "@/lib/roster"
import { createServiceClient, isSupabaseConfigured, throwIfError } from "@/lib/supabase"

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

const ORDERS_FILE = "orders.json"
const PRODUCTS_FILE = "products.json"
const STUDENTS_FILE = "students.json"
const LEDGER_FILE = "point-ledger.json"

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

async function readOrdersLocal(): Promise<OrderRecord[]> {
  const parsed = await readJsonFile<OrderRecord[]>(ORDERS_FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listOrdersByStudent(studentId: string) {
  if (!isSupabaseConfigured()) {
    const orders = await readOrdersLocal()
    return orders
      .filter((order) => order.studentId === studentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

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
  if (!isSupabaseConfigured()) {
    const orders = await readOrdersLocal()
    const filtered = status
      ? orders.filter((order) => order.status === status)
      : orders
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

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
  if (!isSupabaseConfigured()) {
    const orders = await readOrdersLocal()
    return orders.filter((order) => order.status === status).length
  }

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
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const productsRaw = await readJsonFile<ProductRecord[]>(PRODUCTS_FILE, [])
      const studentsRaw = await readJsonFile<StudentRecord[]>(STUDENTS_FILE, [])
      const orders = await readOrdersLocal()
      const ledgerRaw = await readJsonFile<PointLedgerEntry[]>(LEDGER_FILE, [])
      const products = Array.isArray(productsRaw) ? productsRaw : []
      const students = Array.isArray(studentsRaw) ? studentsRaw : []
      const ledger = Array.isArray(ledgerRaw) ? ledgerRaw : []

      const productIndex = products.findIndex((product) => product.id === productId)
      const studentIndex = students.findIndex((student) => student.studentId === studentId)

      if (productIndex === -1 || studentIndex === -1) {
        return {
          ok: false,
          code: "not_found",
          error: "상품을 찾지 못했어요.",
        } as const
      }

      const product = products[productIndex]
      const student: StudentRecord = {
        ...students[studentIndex],
        pointsBalance: students[studentIndex].pointsBalance ?? 0,
      }
      const now = new Date().toISOString()

      if (product.quantity <= 0 || product.saleStatus === "done") {
        return {
          ok: false,
          code: "sold_out",
          error: "방금 다른 친구가 사서 품절이에요.",
        } as const
      }

      if (product.saleStatus !== "on_sale") {
        return {
          ok: false,
          code: "not_on_sale",
          error:
            product.saleStatus === "reserved"
              ? "지금은 예약 중이라 살 수 없어요."
              : "지금은 살 수 없어요.",
        } as const
      }

      if (student.pointsBalance < product.points) {
        return {
          ok: false,
          code: "insufficient",
          error: `포인트가 부족해요. 지금 잔액은 ${student.pointsBalance}P예요.`,
        } as const
      }

      const remainingQuantity = product.quantity - 1
      const remainingPoints = student.pointsBalance - product.points
      const nextProduct: ProductRecord = {
        ...product,
        quantity: remainingQuantity,
        saleStatus: remainingQuantity === 0 ? "done" : product.saleStatus,
        updatedAt: now,
      }
      const nextStudent: StudentRecord = {
        ...student,
        pointsBalance: remainingPoints,
      }
      const order: OrderRecord = {
        id: crypto.randomUUID(),
        studentId,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl,
        points: product.points,
        quantity: 1,
        status: "awaiting_pickup",
        createdAt: now,
      }
      const entry: PointLedgerEntry = {
        id: crypto.randomUUID(),
        studentId,
        amount: -product.points,
        memo: `구매: ${product.name}`,
        grantedBy: studentId,
        createdAt: now,
      }

      products[productIndex] = nextProduct
      students[studentIndex] = nextStudent

      await writeJsonFile(PRODUCTS_FILE, products)
      await writeJsonFile(STUDENTS_FILE, students)
      await writeJsonFile(ORDERS_FILE, [...orders, order])
      await writeJsonFile(LEDGER_FILE, [...ledger, entry])

      return {
        ok: true,
        order,
        remainingPoints,
        remainingQuantity,
      } as const
    })
  }

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
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const productsRaw = await readJsonFile<ProductRecord[]>(PRODUCTS_FILE, [])
      const studentsRaw = await readJsonFile<StudentRecord[]>(STUDENTS_FILE, [])
      const orders = await readOrdersLocal()
      const ledgerRaw = await readJsonFile<PointLedgerEntry[]>(LEDGER_FILE, [])
      const products = Array.isArray(productsRaw) ? productsRaw : []
      const students = Array.isArray(studentsRaw) ? studentsRaw : []
      const ledger = Array.isArray(ledgerRaw) ? ledgerRaw : []

      const orderIndex = orders.findIndex((order) => order.id === orderId)
      const order = orderIndex === -1 ? null : orders[orderIndex]

      if (!order || order.studentId !== studentId) {
        return {
          ok: false,
          code: "not_found",
          error: "주문을 찾지 못했어요.",
        } as const
      }

      if (order.status === "completed") {
        return {
          ok: false,
          code: "not_cancellable",
          error: "이미 받아서 취소할 수 없어요.",
        } as const
      }

      if (order.status !== "awaiting_pickup") {
        return {
          ok: false,
          code: "not_cancellable",
          error: "이미 취소한 주문이에요.",
        } as const
      }

      const studentIndex = students.findIndex((student) => student.studentId === studentId)

      if (studentIndex === -1) {
        return {
          ok: false,
          code: "not_found",
          error: "주문을 찾지 못했어요.",
        } as const
      }

      const now = new Date().toISOString()
      const student = students[studentIndex]
      const remainingPoints = (student.pointsBalance ?? 0) + order.points
      const productIndex = products.findIndex((product) => product.id === order.productId)

      students[studentIndex] = {
        ...student,
        pointsBalance: remainingPoints,
      }
      orders[orderIndex] = {
        ...order,
        status: "cancelled",
      }

      if (productIndex !== -1) {
        const product = products[productIndex]
        products[productIndex] = {
          ...product,
          quantity: product.quantity + order.quantity,
          saleStatus:
            product.saleStatus === "done" && product.quantity === 0
              ? "on_sale"
              : product.saleStatus,
          updatedAt: now,
        }
      }

      const entry: PointLedgerEntry = {
        id: crypto.randomUUID(),
        studentId,
        amount: order.points,
        memo: `취소: ${order.productName}`,
        grantedBy: studentId,
        createdAt: now,
      }

      await writeJsonFile(STUDENTS_FILE, students)
      await writeJsonFile(ORDERS_FILE, orders)
      await writeJsonFile(LEDGER_FILE, [...ledger, entry])

      if (productIndex !== -1) {
        await writeJsonFile(PRODUCTS_FILE, products)
      }

      return {
        ok: true,
        order: orders[orderIndex],
        remainingPoints,
        productId: order.productId,
      } as const
    })
  }

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
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const orders = await readOrdersLocal()
      const orderIndex = orders.findIndex((order) => order.id === orderId)
      const order = orderIndex === -1 ? null : orders[orderIndex]

      if (!order) {
        return {
          ok: false,
          code: "not_found",
          error: "주문을 찾지 못했어요.",
        } as const
      }

      if (order.status === "cancelled") {
        return {
          ok: false,
          code: "not_completable",
          error: "취소된 주문은 수령 처리할 수 없어요.",
        } as const
      }

      if (order.status !== "awaiting_pickup") {
        return {
          ok: false,
          code: "not_completable",
          error: "이미 수령 완료예요.",
        } as const
      }

      orders[orderIndex] = {
        ...order,
        status: "completed",
      }
      await writeJsonFile(ORDERS_FILE, orders)

      return {
        ok: true,
        order: orders[orderIndex],
      } as const
    })
  }

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
