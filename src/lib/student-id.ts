export type ParsedStudentId = {
  studentId: string
  grade: number
  classNumber: number
  studentNumber: number
}

export const STUDENT_ID_HINT = "20101 = 2학년 1반 1번"

export function parseStudentId(
  raw: string
): { ok: true; value: ParsedStudentId } | { ok: false; error: string } {
  const studentId = raw.trim()

  if (!/^\d{5}$/.test(studentId)) {
    return {
      ok: false,
      error: `학번은 숫자 5자리예요. 예: ${STUDENT_ID_HINT}`,
    }
  }

  const grade = Number(studentId[0])
  const classNumber = Number(studentId.slice(1, 3))
  const studentNumber = Number(studentId.slice(3, 5))

  if (grade < 1 || grade > 3) {
    return { ok: false, error: "학년은 1, 2, 3만 쓸 수 있어요." }
  }

  if (classNumber < 1 || classNumber > 99) {
    return { ok: false, error: "반 번호가 올바르지 않아요." }
  }

  if (studentNumber < 1 || studentNumber > 99) {
    return { ok: false, error: "번호가 올바르지 않아요." }
  }

  return {
    ok: true,
    value: { studentId, grade, classNumber, studentNumber },
  }
}
