"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { motion } from "framer-motion"

const STORAGE_KEY = "onion-welcome-hidden"
const MESSAGE_TYPE = "onion-welcome-hide"
export const WELCOME_SHOW_EVENT = "onion-welcome-show"

type WelcomeMode = "open" | "closing" | "closed"

function readHidden() {
  return window.sessionStorage.getItem(STORAGE_KEY) === "1"
}

export function WelcomeFrame() {
  const [mode, setMode] = useState<WelcomeMode | null>(null)

  useLayoutEffect(() => {
    setMode(readHidden() ? "closed" : "open")
  }, [])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string } | null
      if (!data || data.type !== MESSAGE_TYPE) return
      window.sessionStorage.setItem(STORAGE_KEY, "1")
      setMode((current) => (current === "open" ? "closing" : current))
      if (!window.location.pathname.startsWith("/admin")) {
        window.location.assign("/admin")
      }
    }

    function onShow() {
      window.sessionStorage.removeItem(STORAGE_KEY)
      setMode("open")
    }

    window.addEventListener("message", onMessage)
    window.addEventListener(WELCOME_SHOW_EVENT, onShow)
    return () => {
      window.removeEventListener("message", onMessage)
      window.removeEventListener(WELCOME_SHOW_EVENT, onShow)
    }
  }, [])

  if (mode === null) return null

  const closed = mode === "closed"

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      style={{ display: closed ? "none" : "block" }}
      initial={false}
      animate={mode === "open" ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onAnimationComplete={() => {
        if (mode !== "closing") return
        window.sessionStorage.setItem(STORAGE_KEY, "1")
        setMode("closed")
      }}
    >
      {closed ? null : (
        <iframe
          src="/welcome"
          title="わくわく祭り"
          className="block h-dvh w-full border-0 bg-[#FFFDF7]"
        />
      )}
    </motion.div>
  )
}
