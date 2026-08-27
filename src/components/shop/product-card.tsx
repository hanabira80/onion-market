import Link from "next/link"

import { WishlistButton } from "@/components/shop/wishlist-button"
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  SALE_STATUS_LABEL,
  canPurchase,
} from "@/lib/catalog"
import type { ProductRecord } from "@/lib/products"

type ProductCardProps = {
  product: ProductRecord
  href?: string
  wished?: boolean
  showWishlist?: boolean
}

export function ProductCard({
  product,
  href,
  wished = false,
  showWishlist = true,
}: ProductCardProps) {
  const purchasable = canPurchase(product.saleStatus, product.quantity)
  const soldOut = product.quantity === 0 || product.saleStatus === "done"
  const content = (
    <>
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            사진 없음
          </div>
        )}
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/70 px-2 py-1 text-center text-xs font-medium text-background">
            품절
          </span>
        ) : null}
      </div>
      <div className="grid gap-1 p-3">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {CATEGORY_LABEL[product.category]} · 컨디션 {CONDITION_LABEL[product.condition]}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-semibold">{product.points}P</p>
          <p className="text-xs text-muted-foreground">
            {SALE_STATUS_LABEL[product.saleStatus]}
            {purchasable ? ` · ${product.quantity}개` : soldOut ? " · 품절" : ""}
          </p>
        </div>
      </div>
    </>
  )

  const wishlist = showWishlist ? (
    <WishlistButton
      productId={product.id}
      wished={wished}
      className="absolute top-2 right-2 z-10"
    />
  ) : null

  if (!href) {
    return (
      <article className="relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {wishlist}
        {content}
      </article>
    )
  }

  return (
    <article className="relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {wishlist}
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    </article>
  )
}
