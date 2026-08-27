import type { Metadata } from "next"

import { ImportForm } from "@/app/admin/students/import/import-form"
import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: "명단 올리기",
  description: "전교 학생 명단 CSV를 올립니다.",
}

export default async function ImportStudentsPage() {
  await requireAdmin()

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">명단 CSV</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        엑셀에서 CSV로 저장한 뒤 올려 주세요. 이미 있는 학번은 이름·역할만 고치고,
        포인트는 그대로 둡니다.
      </p>
      <div className="mt-8">
        <ImportForm />
      </div>
    </main>
  )
}
