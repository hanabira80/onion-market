"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

import { saveWelcomePoints, type WelcomePointsState } from "@/app/login/actions"
import { ComingSoon } from "@/components/coming-soon"
import { Button } from "@/components/ui/button"
import { NumberField } from "@/components/ui/number-field"

export function WelcomeCover() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [state, formAction, pending] = useActionState<WelcomePointsState, FormData>(
    saveWelcomePoints,
    undefined
  )

  function close() {
    setOpen(false)
    router.replace("/")
  }

  const saved = state && "ok" in state ? state : null

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-background"
          initial={false}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onClick={close}
          role="presentation"
        >
          <ComingSoon>
            <form
              action={formAction}
              className="mt-8 w-full max-w-xs"
              onClick={(event) => event.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid gap-3"
              >
                <h2 className="text-center font-heading text-lg font-semibold tracking-tight">
                  오늘 받은 포인트
                </h2>
                <NumberField
                  id="welcome-points"
                  name="points"
                  aria-label="오늘 받은 포인트"
                  className="h-12 text-center text-2xl tracking-widest"
                />
                {state && "error" in state ? (
                  <p className="text-center text-sm text-destructive">{state.error}</p>
                ) : null}
                {saved ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {saved.amount}P 저장했어요.
                  </p>
                ) : null}
                <Button type="submit" className="h-11 w-full" disabled={pending}>
                  {pending ? "저장 중…" : "저장"}
                </Button>
              </motion.div>
            </form>
          </ComingSoon>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
