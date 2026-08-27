import { parseStudentId } from "@/lib/student-id"
import type { StudentRecord } from "@/lib/roster"
import type { StudentRole } from "@/lib/session"

const HEADER_ALIASES: Record<string, string> = {
  학번: "studentId",
  student_id: "studentId",
  studentid: "studentId",
  이름: "name",
  name: "name",
  학년: "grade",
  grade: "grade",
  반: "classNumber",
  class: "classNumber",
  class_number: "classNumber",
  번호: "studentNumber",
  number: "studentNumber",
  student_number: "studentNumber",
  role: "role",
  역할: "role",
}

export type CsvImportRow = Omit<
  StudentRecord,
  "passwordHash" | "createdAt" | "pointsBalance"
>

export type CsvParseResult =
  | { ok: true; rows: CsvImportRow[] }
  | { ok: false; error: string }

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase()
}

function splitCsvLine(line: string) {
  const delimiter = line.includes("\t") ? "\t" : ","
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseRole(value: string | undefined): StudentRole {
  return value?.trim().toLowerCase() === "admin" ? "admin" : "student"
}

export function parseStudentCsv(raw: string): CsvParseResult {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return { ok: false, error: "헤더와 학생 행이 있는 CSV를 올려 주세요." }
  }

  const headers = splitCsvLine(lines[0]).map((header) => {
    const key = HEADER_ALIASES[normalizeHeader(header)]
    return key ?? normalizeHeader(header)
  })

  if (!headers.includes("studentId") || !headers.includes("name")) {
    return {
      ok: false,
      error: "필수 칸이 없어요. 학번, 이름, 학년, 반, 번호, role 이 필요해요.",
    }
  }

  const rows: CsvImportRow[] = []

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = splitCsvLine(lines[lineIndex])
    const record: Record<string, string> = {}

    headers.forEach((header, index) => {
      record[header] = cells[index] ?? ""
    })

    const parsedId = parseStudentId(record.studentId ?? "")
    if (!parsedId.ok) {
      return {
        ok: false,
        error: `${lineIndex + 1}행 학번 오류: ${parsedId.error}`,
      }
    }

    const name = (record.name ?? "").trim()
    if (!name) {
      return { ok: false, error: `${lineIndex + 1}행에 이름이 없어요.` }
    }

    rows.push({
      studentId: parsedId.value.studentId,
      name,
      grade: Number(record.grade) || parsedId.value.grade,
      classNumber: Number(record.classNumber) || parsedId.value.classNumber,
      studentNumber: Number(record.studentNumber) || parsedId.value.studentNumber,
      role: parseRole(record.role),
    })
  }

  return { ok: true, rows }
}
