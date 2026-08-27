import type { Metadata } from "next"
import Link from "next/link"

import { AdminOrderList } from "@/components/admin/order-list"
import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"
import {
  countOrdersByStatus,
  listOrders,
  type OrderStatus,
} from "@/lib/orders"
import { listStudents } from "@/lib/roster"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "수령 처리",
  description: "교실에서 물건을 가져간 주문을 완료 처리합니다.",
}

const FILTERS = [
  { href: "/admin/orders", status: "awaiting_pickup", label: "수령 대기" },
  { href: "/admin/orders?status=completed", status: "completed", label: "완료" },
  { href: "/admin/orders?status=cancelled", status: "cancelled", label: "취소" },
  { href: "/admin/orders?status=all", status: "all", label: "전체" },
] as const

function parseStatus(value?: string): OrderStatus | undefined {
  if (value === "completed" || value === "cancelled" || value === "awaiting_pickup") {
    return value
  }
  if (value === "all") {
    return undefined
  }
  return "awaiting_pickup"
}

const EMPTY: Record<string, string> = {
  awaiting_pickup: "수령 대기 주문이 없어요.",
  completed: "수령 완료한 주문이 없어요.",
  cancelled: "취소된 주문이 없어요.",
  all: "아직 주문이 없어요.",
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; completed?: string }>
}) {
  await requireAdmin()
  const { status: rawStatus, completed } = await searchParams
  const status = parseStatus(rawStatus)
  const current = rawStatus === "all" ? "all" : (status ?? "awaiting_pickup")
  const [orders, awaitingCount, students] = await Promise.all([
    listOrders(status),
    countOrdersByStatus("awaiting_pickup"),
    listStudents(),
  ])
  const names = new Map(students.map((student) => [student.studentId, student.name]))

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">수령 처리</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        학생이 교실에서 굿즈를 가져가면 수령 완료로 바꿔 주세요. 이후에는 학생이
        취소할 수 없습니다.
      </p>
      <nav className="mt-6 flex flex-wrap items-center gap-1">
        {FILTERS.map((filter) => (
          <Link
            key={filter.status}
            href={filter.href}
            className={cn(
              buttonVariants({
                variant: filter.status === current ? "secondary" : "ghost",
                size: "sm",
              })
            )}
            aria-current={filter.status === current ? "page" : undefined}
          >
            {filter.label}
            {filter.status === "awaiting_pickup" ? ` ${awaitingCount}` : ""}
          </Link>
        ))}
      </nav>
      {completed === "1" ? (
        <p className="mt-6 rounded-xl bg-secondary px-4 py-3 text-sm" role="status">
          수령 완료로 바꿨어요. 학생은 이 주문을 취소할 수 없습니다.
        </p>
      ) : null}
      <AdminOrderList
        orders={orders}
        names={names}
        empty={EMPTY[current] ?? EMPTY.all}
      />
    </main>
  )
}
