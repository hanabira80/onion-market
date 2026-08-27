import Link from "next/link"

import { getStudentCount } from "@/lib/roster"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthShellProps = {
  title: string
  description: string
  children: React.ReactNode
}

export async function AuthShell({ title, description, children }: AuthShellProps) {
  const count = await getStudentCount()

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center font-heading text-lg font-semibold tracking-tight">
          양파마켓
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          공개 회원가입은 없어요. 명단에 있는 학번만 들어올 수 있어요.
        </p>
        {count === 0 ? (
          <p className="mt-2 text-center text-xs">
            <Link
              href="/admin/students/import"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              처음이면 명단 CSV부터
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
