import type { Metadata } from "next"

import { MeNav } from "@/components/layout/me-nav"
import { SiteHeader } from "@/components/layout/site-header"
import { ProductCard } from "@/components/shop/product-card"
import { requireStudent } from "@/lib/auth"
import { getProductById } from "@/lib/products"
import { getStudentById } from "@/lib/roster"
import { listWishlistByStudent } from "@/lib/wishlist"

export const metadata: Metadata = {
  title: "찜 목록",
  description: "찜해 둔 굿즈만 모아서 다시 고릅니다.",
}

export default async function MeWishlistPage() {
  const student = await requireStudent()
  const [record, wishlist] = await Promise.all([
    getStudentById(student.studentId),
    listWishlistByStudent(student.studentId),
  ])
  const points = record?.pointsBalance ?? 0
  const wishedProducts = (
    await Promise.all(wishlist.map((item) => getProductById(item.productId)))
  ).flatMap((product) => (product ? [product] : []))

  return (
    <>
      <SiteHeader student={student} points={points} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">찜 목록</h1>
        <p className="mt-2 text-muted-foreground">
          하트를 다시 누르면 목록에서 빠져요. 품절이어도 기록은 남아 있습니다.
        </p>
        <MeNav current="/me/wishlist" />
        {wishedProducts.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">찜한 굿즈가 없어요.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {wishedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/products/${product.id}`}
                wished
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
