import Link from "next/link"

import { logoutAction } from "@/app/login/actions"
import { ShowWelcomeButton } from "@/components/layout/show-welcome-button"
import { Button, buttonVariants } from "@/components/ui/button"
import type { SessionPayload } from "@/lib/session"

type SiteHeaderProps = {
  student: SessionPayload
  points?: number
  showWelcome?: boolean
}

export function SiteHeader({ student, points, showWelcome = false }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-base font-semibold tracking-tight">
          양파마켓
        </Link>
        <nav className="flex items-center gap-1">
          {student.kind === "teacher" ? (
            <p className="max-w-36 truncate px-2 text-sm">{student.name}</p>
          ) : null}
          {showWelcome ? <ShowWelcomeButton /> : null}
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
          {student.kind === "student" ? (
            <Link href="/me" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              마이
            </Link>
          ) : null}
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
