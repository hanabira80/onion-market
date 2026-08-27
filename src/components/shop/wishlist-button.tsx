"use client"

import { Heart } from "lucide-react"
import { useTransition } from "react"

import { toggleWishlistAction } from "@/app/shop/actions"
import { cn } from "@/lib/utils"

type WishlistButtonProps = {
  productId: string
  wished: boolean
  className?: string
}

export function WishlistButton({ productId, wished, className }: WishlistButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      aria-pressed={wished}
      aria-label={wished ? "찜 해제" : "찜하기"}
      disabled={pending}
      onClick={() => {
        startTransition(() => toggleWishlistAction(productId))
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition-opacity hover:opacity-90 disabled:opacity-60",
        className
      )}
    >
      <Heart
        className={cn("size-4", wished && "fill-primary text-primary")}
      />
    </button>
  )
}
