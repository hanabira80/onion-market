"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type NumberFieldProps = {
  id?: string
  name: string
  defaultValue?: string
  min?: number
  className?: string
  required?: boolean
  "aria-label"?: string
}

function digitsOnly(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (digits === "") {
    return ""
  }
  return digits.replace(/^0+(?=\d)/, "")
}

export function NumberField({
  id,
  name,
  defaultValue = "",
  min = 0,
  className,
  required,
  "aria-label": ariaLabel,
}: NumberFieldProps) {
  const [text, setText] = useState(digitsOnly(defaultValue))

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      aria-label={ariaLabel}
      required={required}
      value={text}
      className={cn(className)}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setText(digitsOnly(event.currentTarget.value))}
      onBlur={() => {
        if (text === "") {
          setText(String(min))
          return
        }
        const next = Math.max(min, Number(text))
        setText(String(next))
      }}
    />
  )
}
