import { redirect } from "next/navigation"

import { getTeacherAccess } from "@/lib/staff"
import { getStudentById, getStudentCount } from "@/lib/roster"
import { readSession, type SessionPayload, type StudentSession } from "@/lib/session"

export async function getCurrentStudent(): Promise<SessionPayload | null> {
  const session = await readSession()

  if (!session) {
    return null
  }

  if (session.kind === "teacher") {
    const access = await getTeacherAccess(session.email)

    if (!access) {
      return null
    }

    return {
      kind: "teacher",
      email: access.email,
      name: session.name || access.email,
      role: "admin",
      adminLevel: access.level,
    }
  }

  const student = await getStudentById(session.studentId)

  if (!student) {
    return null
  }

  return {
    kind: "student",
    studentId: student.studentId,
    name: student.name,
    role: student.role,
  }
}

export async function requireStudent(): Promise<StudentSession> {
  const student = await getCurrentStudent()

  if (student?.kind === "teacher") {
    redirect("/admin")
  }

  if (!student) {
    redirect("/logout")
  }

  return student
}

export async function requireAdmin() {
  const actor = await getCurrentStudent()

  if (actor?.kind === "teacher") {
    return actor
  }

  const count = await getStudentCount()

  if (count === 0) {
    return actor
  }

  if (!actor) {
    redirect("/logout")
  }

  if (actor.role !== "admin") {
    redirect("/")
  }

  return actor
}

export async function requireMaster() {
  const actor = await getCurrentStudent()

  if (!actor) {
    redirect("/logout")
  }

  if (actor.kind !== "teacher" || actor.adminLevel !== "master") {
    redirect("/admin")
  }

  return actor
}
