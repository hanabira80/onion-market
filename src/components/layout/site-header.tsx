import Link from "next/link"

import { logoutAction } from "@/app/login/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import type { SessionPayload } from "@/lib/session"

type SiteHeaderProps = {
  student: SessionPayload
  points?: number
}

export function SiteHeader({ student, points }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-base font-semibold tracking-tight">
          양파마켓
        </Link>
        <nav className="flex items-center gap-1">
          {typeof points === "number" ? (
            <p className="px-2 text-sm font-medium tabular-nums">{points}P</p>
          ) : null}
          {student.role === "admin" ? (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              관리
            </Link>
          ) : null}
          <Link href="/me" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            마이
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </nav>
      </div>
    </header>
  )
}
