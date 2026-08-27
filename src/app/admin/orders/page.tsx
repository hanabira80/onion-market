import type { Metadata } from "next"

import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: "수령 처리",
  description: "교실에서 물건을 가져간 주문을 완료 처리합니다.",
}

export default async function AdminOrdersPage() {
  await requireAdmin()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">수령 처리</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        학생이 포인트로 산 뒤에야 수령 대기 주문이 생겨요. 수령 완료 처리는 다음
        단계에서 열려요.
      </p>
    </main>
  )
}
