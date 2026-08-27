import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ProductForm } from "@/app/admin/products/product-form"
import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"
import { getProductById } from "@/lib/products"

export const metadata: Metadata = {
  title: "상품 수정",
  description: "상품 정보와 판매 상태를 고칩니다.",
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <Link
        href="/admin/products"
        className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit"}
      >
        목록으로
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">상품 수정</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        수량 0이거나 완료면 학생은 살 수 없어요. 예약은 목록에만 보여요.
      </p>
      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </main>
  )
}
