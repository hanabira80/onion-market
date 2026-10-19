import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import type { StudentRole } from "@/lib/session"
import { createServiceClient, isSupabaseConfigured, throwIfError } from "@/lib/supabase"

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

const FILE = "students.json"

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

function normalize(student: StudentRecord): StudentRecord {
  return {
    ...student,
    pointsBalance: student.pointsBalance ?? 0,
  }
}

async function readAllLocal(): Promise<StudentRecord[]> {
  const parsed = await readJsonFile<StudentRecord[]>(FILE, [])
  return Array.isArray(parsed) ? parsed.map(normalize) : []
}

async function writeAllLocal(students: StudentRecord[]) {
  await writeJsonFile(FILE, students)
}

export async function listStudents() {
  if (!isSupabaseConfigured()) {
    return readAllLocal()
  }

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
  if (!isSupabaseConfigured()) {
    return (await readAllLocal()).length
  }

  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
  throwIfError(error)
  return count ?? 0
}

export async function getStudentById(studentId: string) {
  if (!isSupabaseConfigured()) {
    const students = await readAllLocal()
    return students.find((student) => student.studentId === studentId) ?? null
  }

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
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const current = await readAllLocal()
      const byId = new Map(current.map((student) => [student.studentId, student]))
      const now = new Date().toISOString()
      let created = 0
      let updated = 0

      for (const row of incoming) {
        const existing = byId.get(row.studentId)

        if (existing) {
          byId.set(row.studentId, {
            ...existing,
            name: row.name,
            grade: row.grade,
            classNumber: row.classNumber,
            studentNumber: row.studentNumber,
            role: row.role,
          })
          updated += 1
        } else {
          byId.set(row.studentId, {
            ...row,
            passwordHash: null,
            pointsBalance: 0,
            createdAt: now,
          })
          created += 1
        }
      }

      await writeAllLocal([...byId.values()])
      return { created, updated, total: byId.size }
    })
  }

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
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const students = await readAllLocal()
      const index = students.findIndex((student) => student.studentId === studentId)

      if (index === -1) {
        return false
      }

      students[index] = { ...students[index], passwordHash }
      await writeAllLocal(students)
      return true
    })
  }

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

export async function addPointsToStudents(
  studentIds: string[],
  amount: number
) {
  return withLock(async () => {
    const students = await readAllLocal()
    const uniqueIds = [...new Set(studentIds)]
    const found: string[] = []
    const missing: string[] = []

    for (const studentId of uniqueIds) {
      const index = students.findIndex((student) => student.studentId === studentId)
      if (index === -1) {
        missing.push(studentId)
        continue
      }

      students[index] = {
        ...students[index],
        pointsBalance: students[index].pointsBalance + amount,
      }
      found.push(studentId)
    }

    await writeAllLocal(students)
    return { found, missing }
  })
}
