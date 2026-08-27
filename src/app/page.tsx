import type { Metadata } from "next"

import { CategoryFilter } from "@/components/shop/category-filter"
import { ProductCard } from "@/components/shop/product-card"
import { SiteHeader } from "@/components/layout/site-header"
import { requireStudent } from "@/lib/auth"
import { compareShopProducts, isCategory } from "@/lib/catalog"
import { listProducts } from "@/lib/products"
import { getStudentById } from "@/lib/roster"
import { listWishedProductIds } from "@/lib/wishlist"

export const metadata: Metadata = {
  title: "몰",
  description: "기부받은 굿즈를 포인트로 구경하는 학급 마켓.",
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const student = await requireStudent()
  const [{ category: categoryParam }, products, wishedIds, record] = await Promise.all([
    searchParams,
    listProducts(),
    listWishedProductIds(student.studentId),
    getStudentById(student.studentId),
  ])
  const category = categoryParam && isCategory(categoryParam) ? categoryParam : "all"
  const visible = products
    .filter((product) => category === "all" || product.category === category)
    .sort(compareShopProducts)

  return (
    <>
      <SiteHeader student={student} points={record?.pointsBalance ?? 0} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <p className="text-sm text-muted-foreground">
          {student.name} · {student.studentId}
          {student.role === "admin" ? " · 관리자" : ""}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">오늘의 굿즈</h1>
        <CategoryFilter active={category} />
        {visible.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            {products.length === 0
              ? "아직 올라온 상품이 없어요. 관리자가 등록하면 여기에 보여요."
              : "이 카테고리에는 아직 굿즈가 없어요."}
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/products/${product.id}`}
                wished={wishedIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
