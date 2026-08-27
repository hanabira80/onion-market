import type { Metadata } from "next"

import { PointsForm } from "@/app/admin/points/points-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requireAdmin } from "@/lib/auth"
import { listPointLedger } from "@/lib/points"
import { listStudents, searchStudents } from "@/lib/roster"

export const metadata: Metadata = {
  title: "포인트 지급",
  description: "기부한 학생에게 포인트를 개별 또는 일괄로 줍니다.",
}

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireAdmin()
  const { q = "" } = await searchParams
  const students = await searchStudents(q)
  const allStudents = await listStudents()
  const names = new Map(allStudents.map((student) => [student.studentId, student.name]))
  const ledger = await listPointLedger(20)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">포인트 지급</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        학번이나 이름으로 찾은 뒤 체크하고, 1인당 같은 포인트를 주세요.
      </p>
      <form className="mt-6 flex gap-2" action="/admin/points" method="get">
        <Input
          name="q"
          defaultValue={q}
          placeholder="학번 또는 이름"
          className="h-11 max-w-sm text-base"
        />
        <Button type="submit" className="h-11">
          찾기
        </Button>
      </form>
      <div className="mt-8">
        <PointsForm students={students} />
      </div>
      <section className="mt-12">
        <h2 className="font-heading text-lg font-semibold">최근 지급</h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">아직 이력이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl ring-1 ring-foreground/10">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {names.get(entry.studentId) ?? "알 수 없음"} · {entry.studentId}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.memo}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">+{entry.amount}P</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
