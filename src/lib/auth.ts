import { redirect } from "next/navigation"

import { getStudentById, getStudentCount } from "@/lib/roster"
import { readSession, type SessionPayload } from "@/lib/session"

export async function getCurrentStudent(): Promise<SessionPayload | null> {
  const session = await readSession()

  if (!session) {
    return null
  }

  const student = await getStudentById(session.studentId)

  if (!student) {
    return null
  }

  return {
    studentId: student.studentId,
    name: student.name,
    role: student.role,
  }
}

export async function requireStudent() {
  const student = await getCurrentStudent()

  if (!student) {
    redirect("/login")
  }

  return student
}

export async function requireAdmin() {
  const student = await getCurrentStudent()
  const count = await getStudentCount()

  if (count === 0) {
    return student
  }

  if (!student) {
    redirect("/login")
  }

  if (student.role !== "admin") {
    redirect("/")
  }

  return student
}
