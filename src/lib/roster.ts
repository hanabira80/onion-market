import type { StudentRole } from "@/lib/session"
import { createServiceClient, throwIfError } from "@/lib/supabase"

export type StudentRecord = {
  studentId: string
  name: string
  grade: number
  classNumber: number
  studentNumber: number
  role: StudentRole
  passwordHash: string | null
  pointsBalance: number
  createdAt: string
}

type StudentRow = {
  student_id: string
  name: string
  grade: number
  class_number: number
  student_number: number
  role: StudentRole
  password_hash: string | null
  points_balance: number
  created_at: string
}

function mapStudent(row: StudentRow): StudentRecord {
  return {
    studentId: row.student_id,
    name: row.name,
    grade: row.grade,
    classNumber: row.class_number,
    studentNumber: row.student_number,
    role: row.role === "admin" ? "admin" : "student",
    passwordHash: row.password_hash,
    pointsBalance: row.points_balance ?? 0,
    createdAt: row.created_at,
  }
}

export async function listStudents() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("student_id", { ascending: true })
  throwIfError(error)
  return ((data ?? []) as StudentRow[]).map(mapStudent)
}

export async function searchStudents(query: string) {
  const needle = query.trim().toLowerCase()
  const students = await listStudents()

  if (!needle) {
    return students
  }

  return students.filter(
    (student) =>
      student.studentId.includes(needle) ||
      student.name.toLowerCase().includes(needle)
  )
}

export async function getStudentCount() {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
  throwIfError(error)
  return count ?? 0
}

export async function getStudentById(studentId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle()
  throwIfError(error)
  return data ? mapStudent(data as StudentRow) : null
}

export async function upsertStudents(
  incoming: Omit<StudentRecord, "passwordHash" | "createdAt" | "pointsBalance">[]
) {
  const supabase = createServiceClient()
  const { data: existingRows, error: existingError } = await supabase
    .from("students")
    .select("student_id")
  throwIfError(existingError)

  const existingIds = new Set(
    ((existingRows ?? []) as { student_id: string }[]).map((row) => row.student_id)
  )
  const incomingById = new Map(incoming.map((row) => [row.studentId, row]))
  const toInsert: Array<Record<string, unknown>> = []
  const toUpdate: Array<Record<string, unknown>> = []

  for (const row of incomingById.values()) {
    const payload = {
      student_id: row.studentId,
      name: row.name,
      grade: row.grade,
      class_number: row.classNumber,
      student_number: row.studentNumber,
      role: row.role,
    }

    if (existingIds.has(row.studentId)) {
      toUpdate.push(payload)
    } else {
      toInsert.push({
        ...payload,
        password_hash: null,
        points_balance: 0,
      })
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("students").insert(toInsert)
    throwIfError(error)
  }

  for (const payload of toUpdate) {
    const { error } = await supabase
      .from("students")
      .update(payload)
      .eq("student_id", payload.student_id)
    throwIfError(error)
  }

  return {
    created: toInsert.length,
    updated: toUpdate.length,
    total: existingIds.size + toInsert.length,
  }
}

export async function setStudentPassword(
  studentId: string,
  passwordHash: string
) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("students")
    .update({ password_hash: passwordHash })
    .eq("student_id", studentId)
    .select("student_id")
    .maybeSingle()
  throwIfError(error)
  return Boolean(data)
}
