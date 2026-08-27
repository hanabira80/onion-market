import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"
import { getProductStats } from "@/lib/products"

export const metadata: Metadata = {
  title: "관리",
  description: "상품·포인트·명단을 관리합니다.",
}

const LINKS = [
  { href: "/admin/products/new", label: "새 상품 올리기" },
  { href: "/admin/points", label: "포인트 지급" },
  { href: "/admin/students/import", label: "명단 CSV" },
  { href: "/admin/orders", label: "수령 처리" },
]

export default async function AdminPage() {
  await requireAdmin()
  const stats = await getProductStats()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">관리</h1>
      <p className="mt-2 text-muted-foreground">
        받은 굿즈를 올리고, 기부한 학생에게 포인트를 주세요.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <dt className="text-sm text-muted-foreground">전체 상품</dt>
          <dd className="mt-1 text-2xl font-semibold">{stats.total}</dd>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <dt className="text-sm text-muted-foreground">판매중 (수량 있음)</dt>
          <dd className="mt-1 text-2xl font-semibold">{stats.onSale}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-wrap gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={buttonVariants({ variant: link.href.endsWith("/new") ? "default" : "outline" })}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </main>
  )
}
