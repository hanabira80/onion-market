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

const TEACHER_MESSAGES: Record<string, string> = {
  denied: "이 구글 계정은 선생님 명단에 없어요.",
  failed: "구글 로그인에 실패했어요. 다시 시도해 주세요.",
  unconfigured: "구글 로그인이 아직 연결되지 않았어요.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; teacher?: string }>
}) {
  const { step, teacher } = await searchParams
  const setup = await readSetup()
  const showPassword = step === "password" && setup?.purpose === "login"
  const count = await getStudentCount()

  if (step === "password" && !showPassword) {
    redirect("/login")
  }

  return (
    <>
      <iframe
        src="/welcome"
        title="わくわく祭り"
        className="fixed inset-0 z-[9999] block h-dvh w-full border-0 bg-[#FFFDF7]"
      />
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
        <LoginForm
          step={showPassword ? "password" : "id"}
          teacherMessage={teacher ? TEACHER_MESSAGES[teacher] : null}
        />
      </AuthShell>
    </>
  )
}
