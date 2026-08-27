import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/me", label: "요약" },
  { href: "/me/orders", label: "구매" },
  { href: "/me/wishlist", label: "찜" },
] as const

type MeNavProps = {
  current: (typeof LINKS)[number]["href"]
}

export function MeNav({ current }: MeNavProps) {
  return (
    <nav className="mt-6 flex flex-wrap gap-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            buttonVariants({
              variant: link.href === current ? "secondary" : "ghost",
              size: "sm",
            })
          )}
          aria-current={link.href === current ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
