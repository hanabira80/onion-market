import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { getStudentCount } from "@/lib/roster"
import { readSetup } from "@/lib/session"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "로그인",
  description: "학번으로 양파마켓에 들어옵니다.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams
  const setup = await readSetup()
  const showPassword = step === "password" && setup?.purpose === "login"
  const count = await getStudentCount()

  if (step === "password" && !showPassword) {
    redirect("/login")
  }

  return (
    <AuthShell
      title={showPassword ? "비밀번호 입력" : "학번 로그인"}
      description={
        count === 0
          ? "아직 명단이 없어요. 아래 링크로 CSV를 먼저 올려 주세요."
          : showPassword
            ? "비밀번호를 입력하면 몰로 들어가요."
            : "명단에 있는 학번만 들어올 수 있어요."
      }
    >
      <LoginForm step={showPassword ? "password" : "id"} />
    </AuthShell>
  )
}
