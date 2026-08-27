"use client"

import { useActionState } from "react"

import {
  grantPointsAction,
  type GrantState,
} from "@/app/admin/points/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { StudentRecord } from "@/lib/roster"

type PointsFormProps = {
  students: StudentRecord[]
}

export function PointsForm({ students }: PointsFormProps) {
  const [state, formAction, pending] = useActionState<GrantState, FormData>(
    grantPointsAction,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-5">
      <FieldGroup>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색된 학생이 없어요.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-xl ring-1 ring-foreground/10">
            <ul className="divide-y">
              {students.map((student) => (
                <li key={student.studentId} className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={student.studentId}
                    className="size-4 rounded border-input"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {student.name} · {student.studentId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.grade}학년 {student.classNumber}반 {student.studentNumber}번 ·{" "}
                      {student.pointsBalance}P
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="amount">1인당 포인트</FieldLabel>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            defaultValue={10}
            className="h-11 text-base"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="memo">메모</FieldLabel>
          <Input
            id="memo"
            name="memo"
            placeholder="키링 기부"
            className="h-11 text-base"
            required
          />
          <FieldDescription>개별 지급이든 행사 일괄이든, 이유를 남겨 두세요.</FieldDescription>
        </Field>
        {state && "error" in state ? <FieldError>{state.error}</FieldError> : null}
        {state && "ok" in state ? (
          <p className="text-sm">
            {state.granted}명에게 지급했어요.
            {state.missing.length > 0
              ? ` 없는 학번: ${state.missing.join(", ")}`
              : ""}
          </p>
        ) : null}
      </FieldGroup>
      <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending || students.length === 0}>
        {pending ? "지급 중…" : "선택한 학생에게 지급"}
      </Button>
    </form>
  )
}
