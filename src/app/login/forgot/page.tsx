import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ForgotLookupForm } from "@/app/login/forgot/forgot-form"
import { SetupForm } from "@/app/login/setup/setup-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { getStudentById } from "@/lib/roster"
import { readSetup } from "@/lib/session"

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "학번과 이름으로 비밀번호를 다시 정합니다.",
}

export default async function LoginForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams
  const setup = await readSetup()
  const showConfirm = step === "confirm" && setup?.purpose === "reset"

  if (step === "confirm" && !showConfirm) {
    redirect("/login/forgot")
  }

  if (showConfirm && setup) {
    const student = await getStudentById(setup.studentId)

    if (!student) {
      redirect("/login/forgot")
    }

    return (
      <AuthShell
        title="새 비밀번호"
        description="이름이 맞으면 비밀번호를 다시 정할 수 있어요."
      >
        <SetupForm name={student.name} submitLabel="비밀번호 다시 정하기" />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="비밀번호 찾기"
      description="학번을 넣으면 명단의 이름을 보여 드려요."
    >
      <ForgotLookupForm />
    </AuthShell>
  )
}
