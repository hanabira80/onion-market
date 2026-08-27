import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { ProductCard } from "@/components/shop/product-card"
import { requireAdmin } from "@/lib/auth"
import { listProducts } from "@/lib/products"

export const metadata: Metadata = {
  title: "상품",
  description: "몰에 올라간 굿즈를 보고 고칩니다.",
}

export default async function AdminProductsPage() {
  await requireAdmin()
  const products = await listProducts()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">상품</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            판매중이고 수량이 있을 때만 학생이 살 수 있어요.
          </p>
        </div>
        <Link href="/admin/products/new" className={buttonVariants()}>
          새 상품
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">아직 올린 상품이 없어요.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/admin/products/${product.id}`}
              showWishlist={false}
            />
          ))}
        </div>
      )}
    </main>
  )
}
