import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SetupForm } from "@/app/login/setup/setup-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { getStudentById } from "@/lib/roster"
import { readSetup } from "@/lib/session"

export const metadata: Metadata = {
  title: "비밀번호 설정",
  description: "이름을 확인하고 비밀번호를 처음 정합니다.",
}

export default async function LoginSetupPage() {
  const setup = await readSetup()

  if (!setup || setup.purpose !== "setup") {
    redirect("/login")
  }

  const student = await getStudentById(setup.studentId)

  if (!student) {
    redirect("/login")
  }

  return (
    <AuthShell
      title="이름 확인"
      description="선생님이 넣어 둔 이름이 맞는지 보고, 비밀번호를 정하세요."
    >
      <SetupForm name={student.name} submitLabel="비밀번호 정하고 들어가기" />
    </AuthShell>
  )
}
