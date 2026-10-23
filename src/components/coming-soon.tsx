"use client"

import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const TEXT = "もうすぐオープン！"

const hop = {
  duration: 0.48,
  times: [0, 0.42, 1],
  ease: ["easeOut", "easeIn"] as ["easeOut", "easeIn"],
}

export function ComingSoon({ children }: { children?: React.ReactNode }) {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!dotLottie) return

    const onLoop = (event: { loopCount: number }) => {
      setActive(event.loopCount % TEXT.length)
    }

    dotLottie.addEventListener("loop", onLoop)
    setActive(0)

    return () => {
      dotLottie.removeEventListener("loop", onLoop)
    }
  }, [dotLottie])

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6"
      style={{
        paddingTop: "calc(1.5rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))",
      }}
    >
      <div className="aspect-square w-[60vw] max-w-[420px]">
        <DotLottieReact
          src="/spooky-onion.lottie"
          loop
          autoplay
          dotLottieRefCallback={setDotLottie}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <h1
        className="mt-6 text-center text-[clamp(1.35rem,6.4vw,2.25rem)] leading-none font-bold tracking-wide whitespace-nowrap text-foreground"
        style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontWeight: 700 }}
      >
        {Array.from(TEXT).map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            className="inline-block"
            animate={index === active ? { y: [0, -16, 0] } : { y: 0 }}
            transition={index === active ? hop : { duration: 0.2 }}
          >
            {char}
          </motion.span>
        ))}
      </h1>
      {children}
    </main>
  )
}
