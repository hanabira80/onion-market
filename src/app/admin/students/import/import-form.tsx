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
          <FieldLabel htmlFor="file">CSV 파일</FieldLabel>
          <Input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="h-11 pt-1.5"
            required
          />
          <FieldDescription>
            칸 순서: 학번, 이름, 학년, 반, 번호, role (student 또는 admin)
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
