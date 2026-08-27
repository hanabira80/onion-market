import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import type { StudentRole } from "@/lib/session"

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

const FILE = "students.json"

function normalize(student: StudentRecord): StudentRecord {
  return {
    ...student,
    pointsBalance: student.pointsBalance ?? 0,
  }
}

async function readAll(): Promise<StudentRecord[]> {
  const parsed = await readJsonFile<StudentRecord[]>(FILE, [])
  return Array.isArray(parsed) ? parsed.map(normalize) : []
}

async function writeAll(students: StudentRecord[]) {
  await writeJsonFile(FILE, students)
}

export async function listStudents() {
  return readAll()
}

export async function searchStudents(query: string) {
  const needle = query.trim().toLowerCase()
  const students = await readAll()

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
  const students = await readAll()
  return students.length
}

export async function getStudentById(studentId: string) {
  const students = await readAll()
  return students.find((student) => student.studentId === studentId) ?? null
}

export async function upsertStudents(
  incoming: Omit<StudentRecord, "passwordHash" | "createdAt" | "pointsBalance">[]
) {
  return withLock(async () => {
    const current = await readAll()
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

    await writeAll([...byId.values()])
    return { created, updated, total: byId.size }
  })
}

export async function setStudentPassword(
  studentId: string,
  passwordHash: string
) {
  return withLock(async () => {
    const students = await readAll()
    const index = students.findIndex((student) => student.studentId === studentId)

    if (index === -1) {
      return false
    }

    students[index] = { ...students[index], passwordHash }
    await writeAll(students)
    return true
  })
}

export async function addPointsToStudents(
  studentIds: string[],
  amount: number
) {
  return withLock(async () => {
    const students = await readAll()
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

    await writeAll(students)
    return { found, missing }
  })
}
