import type { Metadata } from "next"

import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "もうすぐオープン！",
}

export default function HomePage() {
  return <ComingSoon />
}
