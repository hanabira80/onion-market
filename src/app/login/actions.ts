"use server"

import { redirect } from "next/navigation"

import { getStudentById, setStudentPassword } from "@/lib/roster"
import { hashPassword, validateNewPassword, verifyPassword } from "@/lib/passwords"
import {
  clearSession,
  clearSetup,
  createSession,
  createSetup,
  readSetup,
} from "@/lib/session"
import { parseStudentId } from "@/lib/student-id"

export type ActionState = { error: string } | undefined

export async function lookupStudentId(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseStudentId(String(formData.get("studentId") ?? ""))

  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const student = await getStudentById(parsed.value.studentId)

  if (!student) {
    return { error: "명단에 없는 학번입니다." }
  }

  if (!student.passwordHash) {
    await createSetup({ studentId: student.studentId, purpose: "setup" })
    redirect("/login/setup")
  }

  await createSetup({ studentId: student.studentId, purpose: "login" })
  redirect("/login?step=password")
}

export async function loginWithPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const setup = await readSetup()

  if (!setup || setup.purpose !== "login") {
    redirect("/login")
  }

  const student = await getStudentById(setup.studentId)
  const password = String(formData.get("password") ?? "")

  if (!student?.passwordHash || !(await verifyPassword(password, student.passwordHash))) {
    return { error: "학번 또는 비밀번호가 올바르지 않습니다." }
  }

  await createSession({
    studentId: student.studentId,
    name: student.name,
    role: student.role,
  })
  await clearSetup()
  redirect("/")
}

export async function confirmAndSetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const setup = await readSetup()

  if (!setup || (setup.purpose !== "setup" && setup.purpose !== "reset")) {
    redirect("/login")
  }

  const confirmed = formData.get("confirmed") === "yes"
  if (!confirmed) {
    return { error: "본인 이름이 맞는지 확인해 주세요." }
  }

  const passwordError = validateNewPassword(
    String(formData.get("password") ?? ""),
    String(formData.get("confirmPassword") ?? "")
  )

  if (passwordError) {
    return { error: passwordError }
  }

  const student = await getStudentById(setup.studentId)
  if (!student) {
    await clearSetup()
    return { error: "명단에 없는 학번입니다." }
  }

  const saved = await setPasswordAndSignIn(
    student.studentId,
    student.name,
    student.role,
    String(formData.get("password") ?? "")
  )

  if (!saved) {
    return { error: "비밀번호를 저장하지 못했어요. 다시 시도해 주세요." }
  }

  redirect("/")
}

export async function declineIdentity() {
  await clearSetup()
  redirect("/login")
}

export async function lookupForgotStudent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseStudentId(String(formData.get("studentId") ?? ""))

  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const student = await getStudentById(parsed.value.studentId)

  if (!student) {
    return { error: "명단에 없는 학번입니다." }
  }

  await createSetup({ studentId: student.studentId, purpose: "reset" })
  redirect("/login/forgot?step=confirm")
}

export async function logoutAction() {
  await clearSession()
  await clearSetup()
  redirect("/login")
}

async function setPasswordAndSignIn(
  studentId: string,
  name: string,
  role: "student" | "admin",
  password: string
) {
  const passwordHash = await hashPassword(password)
  const saved = await setStudentPassword(studentId, passwordHash)

  if (!saved) {
    return false
  }

  await createSession({ studentId, name, role })
  await clearSetup()
  return true
}
