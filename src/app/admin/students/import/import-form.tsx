"use client"

import { useActionState } from "react"

import {
  importStudentsCsv,
  type ImportState,
} from "@/app/admin/students/import/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importStudentsCsv,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="file">엑셀 파일</FieldLabel>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="h-11 pt-1.5"
            required
          />
          <FieldDescription>
            첫 줄에 학번, 이름. .xlsx를 그대로 올리면 됩니다.
          </FieldDescription>
        </Field>
        {state && "error" in state ? <FieldError>{state.error}</FieldError> : null}
        {state && "ok" in state ? (
          <p className="text-sm text-foreground">
            올렸어요. 새로 {state.created}명, 수정 {state.updated}명, 전체 {state.total}명.
          </p>
        ) : null}
      </FieldGroup>
      <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
        {pending ? "올리는 중…" : "명단 올리기"}
      </Button>
    </form>
  )
}
