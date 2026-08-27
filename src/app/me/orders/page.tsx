import type { Metadata } from "next"

import { MeNav } from "@/components/layout/me-nav"
import { SiteHeader } from "@/components/layout/site-header"
import { OrderList } from "@/components/shop/order-list"
import { requireStudent } from "@/lib/auth"
import { listOrdersByStudent } from "@/lib/orders"
import { getStudentById } from "@/lib/roster"

export const metadata: Metadata = {
  title: "구매 목록",
  description: "포인트로 산 굿즈와 수령 전 취소를 모아서 봅니다.",
}

export default async function MeOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>
}) {
  const student = await requireStudent()
  const { cancelled } = await searchParams
  const [record, orders] = await Promise.all([
    getStudentById(student.studentId),
    listOrdersByStudent(student.studentId),
  ])
  const points = record?.pointsBalance ?? 0

  return (
    <>
      <SiteHeader student={student} points={points} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">구매 목록</h1>
        <p className="mt-2 text-muted-foreground">
          수령 대기인 주문만 취소할 수 있어요. 취소하면 포인트와 재고가 돌아옵니다.
        </p>
        <MeNav current="/me/orders" />
        {cancelled === "1" ? (
          <p
            className="mt-6 rounded-xl bg-secondary px-4 py-3 text-sm"
            role="status"
          >
            주문을 취소했어요. 포인트와 재고가 다시 들어왔습니다.
          </p>
        ) : null}
        <OrderList orders={orders} empty="아직 산 굿즈가 없어요." />
      </main>
    </>
  )
}
