import type { Metadata } from "next"

import { removeSubAdminAction } from "@/app/admin/staff/actions"
import { StaffForm } from "@/app/admin/staff/staff-form"
import { Button } from "@/components/ui/button"
import { requireMaster } from "@/lib/auth"
import { listSubAdmins, masterAdminEmail } from "@/lib/staff"

export const metadata: Metadata = {
  title: "선생님",
  description: "서브 관리자 구글 계정을 추가합니다.",
}

export default async function AdminStaffPage() {
  await requireMaster()
  const subs = await listSubAdmins()
  const master = masterAdminEmail()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">선생님</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        메인 마스터만 서브 관리자를 추가할 수 있어요. 인원 제한은 없어요.
      </p>
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">명단</h2>
        <ul className="mt-3 min-h-24 divide-y rounded-xl ring-1 ring-foreground/10">
          <li className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{master}</p>
              <p className="text-xs text-muted-foreground">메인 마스터</p>
            </div>
          </li>
          {subs.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              아직 서브 관리자가 없어요.
            </li>
          ) : (
            subs.map((admin) => (
              <li key={admin.email} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">서브 관리자</p>
                </div>
                <form action={removeSubAdminAction}>
                  <input type="hidden" name="email" value={admin.email} />
                  <Button type="submit" variant="ghost" size="sm">
                    빼기
                  </Button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold">추가</h2>
        <div className="mt-4">
          <StaffForm />
        </div>
      </section>
    </main>
  )
}
