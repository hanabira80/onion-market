"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const rise = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

type AuthPanelProps = {
  title: string
  description: string
  count: number
  children: React.ReactNode
}

export function AuthPanel({ title, description, count, children }: AuthPanelProps) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[-2rem] bottom-8 h-48 w-48 rounded-full bg-amber-200/80 blur-3xl" />
        <div className="absolute bottom-[-3rem] left-6 h-40 w-40 rounded-full bg-rose-200/70 blur-3xl" />
      </div>
      <motion.div className="relative w-full max-w-md" initial={false}>
        <motion.p
          className="mb-6 text-center font-heading text-lg font-semibold tracking-tight"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          양파마켓
        </motion.p>
        <motion.section
          className="rounded-3xl border border-white/70 bg-white/45 p-6 shadow-[0_8px_32px_rgba(90,40,20,0.08)] backdrop-blur-xl"
          variants={rise}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.04 }}
        >
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            공개 회원가입은 없어요. 명단에 있는 학번만 들어올 수 있어요.
          </p>
          {count === 0 ? (
            <p className="mt-2 text-center text-xs">
              <Link
                href="/admin/students/import"
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                처음이면 명단 엑셀부터
              </Link>
            </p>
          ) : null}
        </motion.section>
      </motion.div>
    </div>
  )
}
