import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import type { ProductRecord } from "@/lib/products"
import type { PointLedgerEntry } from "@/lib/points"
import type { StudentRecord } from "@/lib/roster"

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

const ORDERS_FILE = "orders.json"
const PRODUCTS_FILE = "products.json"
const STUDENTS_FILE = "students.json"
const LEDGER_FILE = "point-ledger.json"

async function readOrders(): Promise<OrderRecord[]> {
  const parsed = await readJsonFile<OrderRecord[]>(ORDERS_FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listOrdersByStudent(studentId: string) {
  const orders = await readOrders()
  return orders
    .filter((order) => order.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function purchaseProduct(
  studentId: string,
  productId: string
): Promise<PurchaseResult> {
  return withLock(async () => {
    const productsRaw = await readJsonFile<ProductRecord[]>(PRODUCTS_FILE, [])
    const studentsRaw = await readJsonFile<StudentRecord[]>(STUDENTS_FILE, [])
    const orders = await readOrders()
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

export async function cancelOrder(
  studentId: string,
  orderId: string
): Promise<CancelResult> {
  return withLock(async () => {
    const productsRaw = await readJsonFile<ProductRecord[]>(PRODUCTS_FILE, [])
    const studentsRaw = await readJsonFile<StudentRecord[]>(STUDENTS_FILE, [])
    const orders = await readOrders()
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
      const remainingQuantity = product.quantity + order.quantity
      products[productIndex] = {
        ...product,
        quantity: remainingQuantity,
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
