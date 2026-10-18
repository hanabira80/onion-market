"use client"

import { useActionState } from "react"

import { addSubAdminAction, type StaffState } from "@/app/admin/staff/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function StaffForm() {
  const [state, formAction, pending] = useActionState<StaffState, FormData>(
    addSubAdminAction,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">구글 메일</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="teacher@gmail.com"
            className="h-11 text-base"
            required
          />
        </Field>
        {state && "error" in state ? <FieldError>{state.error}</FieldError> : null}
        {state && "ok" in state ? (
          <p className="text-sm">서브 관리자를 추가했어요.</p>
        ) : null}
      </FieldGroup>
      <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
        {pending ? "추가 중…" : "서브 관리자 추가"}
      </Button>
    </form>
  )
}
