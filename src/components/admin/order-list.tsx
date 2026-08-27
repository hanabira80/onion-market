import Link from "next/link"

import { CompleteOrderForm } from "@/components/admin/complete-order-form"
import {
  ORDER_STATUS_LABEL,
  formatOrderTime,
  type OrderRecord,
} from "@/lib/orders"

type AdminOrderListProps = {
  orders: OrderRecord[]
  names: Map<string, string>
  empty: string
}

export function AdminOrderList({ orders, names, empty }: AdminOrderListProps) {
  if (orders.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <ul className="mt-3 grid gap-2">
      {orders.map((order) => {
        const studentName = names.get(order.studentId) ?? "알 수 없음"
        return (
          <li
            key={order.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3 text-sm ring-1 ring-foreground/10"
          >
            <Link
              href={`/products/${order.productId}`}
              className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted"
            >
              {order.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.productImageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                  사진 없음
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{order.productName}</p>
              <p className="mt-0.5 text-muted-foreground">
                {studentName} · {order.studentId} · {ORDER_STATUS_LABEL[order.status]} ·{" "}
                {order.points}P
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatOrderTime(order.createdAt)}
              </p>
            </div>
            {order.status === "awaiting_pickup" ? (
              <CompleteOrderForm
                orderId={order.id}
                productName={order.productName}
                studentName={studentName}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
