import Link from "next/link"

import { CancelOrderForm } from "@/components/shop/cancel-order-form"
import {
  ORDER_STATUS_LABEL,
  formatOrderTime,
  type OrderRecord,
} from "@/lib/orders"

type OrderListProps = {
  orders: OrderRecord[]
  empty: string
}

export function OrderList({ orders, empty }: OrderListProps) {
  if (orders.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <ul className="mt-3 grid gap-2">
      {orders.map((order) => (
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
            <Link
              href={`/products/${order.productId}`}
              className="font-medium hover:underline"
            >
              {order.productName}
            </Link>
            <p className="mt-0.5 text-muted-foreground">
              {ORDER_STATUS_LABEL[order.status]} · {order.points}P · {order.quantity}
              개
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatOrderTime(order.createdAt)}
            </p>
          </div>
          {order.status === "awaiting_pickup" ? (
            <CancelOrderForm
              orderId={order.id}
              productName={order.productName}
              points={order.points}
            />
          ) : null}
        </li>
      ))}
    </ul>
  )
}
