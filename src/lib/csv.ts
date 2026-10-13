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

function mapHeaders(cells: string[]) {
  return cells.map((header) => {
    const key = HEADER_ALIASES[normalizeHeader(header)]
    return key ?? normalizeHeader(header)
  })
}

export function parseStudentTable(matrix: string[][]): CsvParseResult {
  const filled = matrix
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some(Boolean))

  const headerIndex = filled.findIndex((row) => {
    const headers = mapHeaders(row)
    return headers.includes("studentId") && headers.includes("name")
  })

  if (headerIndex === -1) {
    return {
      ok: false,
      error: "학번, 이름 칸이 있는 명부를 올려 주세요.",
    }
  }

  const headers = mapHeaders(filled[headerIndex])
  const rows: CsvImportRow[] = []
  const seen = new Set<string>()

  for (let index = headerIndex + 1; index < filled.length; index += 1) {
    const cells = filled[index]
    const record: Record<string, string> = {}
    const lineNumber = index + 1

    headers.forEach((header, cellIndex) => {
      record[header] = cells[cellIndex] ?? ""
    })

    const parsedId = parseStudentId(record.studentId ?? "")
    if (!parsedId.ok) {
      return {
        ok: false,
        error: `${lineNumber}행 학번 오류: ${parsedId.error}`,
      }
    }

    if (seen.has(parsedId.value.studentId)) {
      return {
        ok: false,
        error: `${lineNumber}행 학번 ${parsedId.value.studentId}이 파일 안에 두 번 있어요.`,
      }
    }

    const name = (record.name ?? "").trim()
    if (!name) {
      return { ok: false, error: `${lineNumber}행에 이름이 없어요.` }
    }

    seen.add(parsedId.value.studentId)
    rows.push({
      studentId: parsedId.value.studentId,
      name,
      grade: Number(record.grade) || parsedId.value.grade,
      classNumber: Number(record.classNumber) || parsedId.value.classNumber,
      studentNumber: Number(record.studentNumber) || parsedId.value.studentNumber,
      role: parseRole(record.role),
    })
  }

  if (rows.length === 0) {
    return { ok: false, error: "저장할 학생이 없어요." }
  }

  return { ok: true, rows }
}

export function parseStudentCsv(raw: string): CsvParseResult {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return { ok: false, error: "헤더와 학생 행이 있는 파일을 올려 주세요." }
  }

  return parseStudentTable(lines.map(splitCsvLine))
}
