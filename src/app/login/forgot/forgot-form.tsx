"use client"

import { useActionState } from "react"

import { lookupForgotStudent, type ActionState } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { STUDENT_ID_HINT } from "@/lib/student-id"

export function ForgotLookupForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    lookupForgotStudent,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="studentId">학번</FieldLabel>
          <Input
            id="studentId"
            name="studentId"
            inputMode="numeric"
            autoComplete="username"
            maxLength={5}
            placeholder="20101"
            className="h-11 text-base tracking-widest"
            required
          />
          <FieldDescription>{STUDENT_ID_HINT}</FieldDescription>
        </Field>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
      </FieldGroup>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "확인 중…" : "이름 확인"}
      </Button>
    </form>
  )
}
