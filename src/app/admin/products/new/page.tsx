import type { Metadata } from "next"
import Link from "next/link"

import { ProductForm } from "@/app/admin/products/product-form"
import { buttonVariants } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: "새 상품",
  description: "기부받은 굿즈를 몰에 올립니다.",
}

export default async function NewProductPage() {
  await requireAdmin()

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <Link
        href="/admin/products"
        className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit"}
      >
        목록으로
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">새 상품</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        사진 1장, 컨디션, 판매 상태, 포인트, 수량, 카테고리를 넣어 주세요.
      </p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </main>
  )
}
