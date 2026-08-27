"use client"

import { useActionState } from "react"
import Link from "next/link"

import { lookupStudentId, loginWithPassword, type ActionState } from "@/app/login/actions"
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

type LoginFormProps = {
  step: "id" | "password"
}

export function LoginForm({ step }: LoginFormProps) {
  const action = step === "password" ? loginWithPassword : lookupStudentId
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-5">
      <FieldGroup>
        {step === "id" ? (
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
        ) : (
          <Field>
            <FieldLabel htmlFor="password">비밀번호</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11 text-base"
              required
            />
          </Field>
        )}
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
      </FieldGroup>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "확인 중…" : step === "password" ? "로그인" : "다음"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        비밀번호를 잊었나요?{" "}
        <Link href="/login/forgot" className="text-foreground underline-offset-4 hover:underline">
          다시 정하기
        </Link>
      </p>
    </form>
  )
}
