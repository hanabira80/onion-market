"use client"

import { useActionState } from "react"

import {
  confirmAndSetPassword,
  declineIdentity,
  type ActionState,
} from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SetupFormProps = {
  name: string
  submitLabel: string
}

export function SetupForm({ name, submitLabel }: SetupFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    confirmAndSetPassword,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-5">
      <div className="rounded-xl bg-accent px-4 py-3">
        <p className="text-sm text-muted-foreground">명단에 있는 이름</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{name}</p>
      </div>
      <FieldGroup>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            name="confirmed"
            value="yes"
            className="mt-1 size-4 rounded border-input"
            required
          />
          본인이 맞아요. 이 이름으로 비밀번호를 정할게요.
        </label>
        <Field>
          <FieldLabel htmlFor="password">새 비밀번호</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="h-11 text-base"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">비밀번호 확인</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="h-11 text-base"
            required
          />
        </Field>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
      </FieldGroup>
      <div className="grid gap-2">
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "저장 중…" : submitLabel}
        </Button>
        <Button
          type="submit"
          variant="ghost"
          className="h-11 w-full"
          formAction={declineIdentity}
        >
          내 이름이 아니에요
        </Button>
      </div>
    </form>
  )
}
