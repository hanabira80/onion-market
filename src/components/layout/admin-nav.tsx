"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/admin", label: "요약" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/points", label: "포인트" },
  { href: "/admin/students/import", label: "명단" },
  { href: "/admin/orders", label: "수령" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" })
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
