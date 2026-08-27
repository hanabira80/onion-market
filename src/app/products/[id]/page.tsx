import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PurchaseForm } from "@/components/shop/purchase-form"
import { WishlistButton } from "@/components/shop/wishlist-button"
import { SiteHeader } from "@/components/layout/site-header"
import { requireStudent } from "@/lib/auth"
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  SALE_STATUS_LABEL,
  canPurchase,
} from "@/lib/catalog"
import { getProductById } from "@/lib/products"
import { getStudentById } from "@/lib/roster"
import { listWishedProductIds } from "@/lib/wishlist"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)

  return {
    title: product?.name ?? "상품",
    description: product
      ? `${product.name} · ${product.points}P · ${CATEGORY_LABEL[product.category]}`
      : "상품을 찾을 수 없습니다.",
    robots: { index: false, follow: false },
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ purchased?: string }>
}) {
  const student = await requireStudent()
  const { id } = await params
  const { purchased } = await searchParams
  const [product, record, wishedIds] = await Promise.all([
    getProductById(id),
    getStudentById(student.studentId),
    listWishedProductIds(student.studentId),
  ])

  if (!product) {
    notFound()
  }

  const purchasable = canPurchase(product.saleStatus, product.quantity)
  const balance = record?.pointsBalance ?? 0
  const justPurchased = purchased === "1"

  let unavailableReason = "지금은 살 수 없어요"
  if (product.saleStatus === "reserved") {
    unavailableReason = "예약 중이라 살 수 없어요"
  } else if (product.quantity === 0 || product.saleStatus === "done") {
    unavailableReason = "품절이에요"
  }

  return (
    <>
      <SiteHeader student={student} points={balance} />
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative overflow-hidden rounded-xl bg-muted">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-muted-foreground">
              사진 없음
            </div>
          )}
          <WishlistButton
            productId={product.id}
            wished={wishedIds.has(product.id)}
            className="absolute top-3 right-3"
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_LABEL[product.category]}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          {justPurchased ? (
            <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              구매했어요. 잔액 {balance}P · 주문은 수령 대기예요. 교실에서 받아 가세요.
            </p>
          ) : null}
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">컨디션</dt>
              <dd>{CONDITION_LABEL[product.condition]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">판매 상태</dt>
              <dd>{SALE_STATUS_LABEL[product.saleStatus]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">수량</dt>
              <dd>{product.quantity}개</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">필요 포인트</dt>
              <dd className="text-base font-semibold">{product.points}P</dd>
            </div>
          </dl>
          <PurchaseForm
            productId={product.id}
            productName={product.name}
            points={product.points}
            balance={balance}
            purchasable={purchasable}
            unavailableReason={unavailableReason}
          />
        </div>
      </main>
    </>
  )
}
