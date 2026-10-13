import ExcelJS from "exceljs"

import { parseStudentTable, type CsvParseResult } from "@/lib/csv"

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) {
    return ""
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value.toString().trim()
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(value).trim()
  }

  if (value instanceof Date) {
    return ""
  }

  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim()
    }

    if ("text" in value && typeof value.text === "string") {
      return value.text.trim()
    }

    if ("result" in value) {
      return cellToString(value.result as ExcelJS.CellValue)
    }
  }

  return ""
}

export async function parseStudentWorkbook(data: ArrayBuffer): Promise<CsvParseResult> {
  const workbook = new ExcelJS.Workbook()

  try {
    await workbook.xlsx.load(Buffer.from(data) as unknown as ExcelJS.Buffer)
  } catch {
    return { ok: false, error: "엑셀 파일을 읽지 못했어요. .xlsx 파일인지 확인해 주세요." }
  }

  const sheet = workbook.worksheets[0]

  if (!sheet) {
    return { ok: false, error: "시트가 없어요." }
  }

  const matrix: string[][] = []

  sheet.eachRow({ includeEmpty: false }, (row) => {
    const width = Math.max(row.cellCount, 2)
    const cells: string[] = []

    for (let index = 1; index <= width; index += 1) {
      cells.push(cellToString(row.getCell(index).value))
    }

    while (cells.length > 0 && cells[cells.length - 1] === "") {
      cells.pop()
    }

    if (cells.some(Boolean)) {
      matrix.push(cells)
    }
  })

  return parseStudentTable(matrix)
}
