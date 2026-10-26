"use client"

import { WELCOME_SHOW_EVENT } from "@/components/auth/welcome-frame"
import { Button } from "@/components/ui/button"

export function ShowWelcomeButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => window.dispatchEvent(new Event(WELCOME_SHOW_EVENT))}
    >
      축제
    </Button>
  )
}
