"use client"

import { useActionState } from "react"
import { motion } from "framer-motion"

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

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

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
    <motion.form
      action={formAction}
      className="grid gap-5"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
    >
      <motion.div
        variants={item}
        className="rounded-2xl border border-white/70 bg-white/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md"
      >
        <p className="text-sm text-muted-foreground">이 학번의 학생이 맞나요?</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{name}</p>
      </motion.div>
      <FieldGroup>
        <motion.label
          variants={item}
          className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/40 p-4 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md"
        >
          <input
            type="checkbox"
            name="confirmed"
            value="yes"
            className="mt-1 size-4 rounded border-white/80 bg-white/70"
            required
          />
          {name} 님이 맞아요. 이 이름으로 비밀번호를 정할게요.
        </motion.label>
        <motion.div variants={item}>
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
        </motion.div>
        <motion.div variants={item}>
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
        </motion.div>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
      </FieldGroup>
      <motion.div variants={item} className="grid gap-2">
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
      </motion.div>
    </motion.form>
  )
}
