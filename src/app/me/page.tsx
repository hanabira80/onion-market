import type { Metadata } from "next"

import { ProductCard } from "@/components/shop/product-card"
import { SiteHeader } from "@/components/layout/site-header"
import { requireStudent } from "@/lib/auth"
import { listOrdersByStudent, ORDER_STATUS_LABEL } from "@/lib/orders"
import { getProductById } from "@/lib/products"
import { getStudentById } from "@/lib/roster"
import { listWishlistByStudent } from "@/lib/wishlist"

export const metadata: Metadata = {
  title: "마이페이지",
  description: "내 포인트와 구매·찜을 모아서 봅니다.",
}

export default async function MePage() {
  const student = await requireStudent()
  const [record, orders, wishlist] = await Promise.all([
    getStudentById(student.studentId),
    listOrdersByStudent(student.studentId),
    listWishlistByStudent(student.studentId),
  ])
  const points = record?.pointsBalance ?? 0
  const wishedProducts = (
    await Promise.all(wishlist.map((item) => getProductById(item.productId)))
  ).flatMap((product) => (product ? [product] : []))
  const recentOrders = orders.slice(0, 5)

  return (
    <>
      <SiteHeader student={student} points={points} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">마이페이지</h1>
        <p className="mt-2 text-muted-foreground">{student.name} 학생</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <dt className="text-sm text-muted-foreground">포인트</dt>
            <dd className="mt-1 text-2xl font-semibold">{points}P</dd>
          </div>
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <dt className="text-sm text-muted-foreground">구매</dt>
            <dd className="mt-1 text-2xl font-semibold">{orders.length}건</dd>
          </div>
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <dt className="text-sm text-muted-foreground">찜</dt>
            <dd className="mt-1 text-2xl font-semibold">{wishlist.length}개</dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold">최근 구매</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">아직 산 굿즈가 없어요.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
                >
                  <div>
                    <p className="font-medium">{order.productName}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {ORDER_STATUS_LABEL[order.status]} · {order.points}P
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold">찜한 굿즈</h2>
          {wishedProducts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">찜한 굿즈가 없어요.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
        </section>
      </main>
    </>
  )
}
