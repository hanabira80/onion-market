"use client"

import { useActionState, useState } from "react"

import { purchaseProductAction, type ShopActionState } from "@/app/shop/actions"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

type PurchaseFormProps = {
  productId: string
  productName: string
  points: number
  balance: number
  purchasable: boolean
  unavailableReason: string
}

export function PurchaseForm({
  productId,
  productName,
  points,
  balance,
  purchasable,
  unavailableReason,
}: PurchaseFormProps) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState<ShopActionState, FormData>(
    purchaseProductAction,
    undefined
  )
  const remaining = balance - points
  const canAfford = balance >= points

  if (!purchasable) {
    return (
      <div className="mt-8 grid gap-3">
        <p className="text-sm text-muted-foreground">
          내 잔액 <span className="font-medium text-foreground">{balance}P</span>
        </p>
        <Button className="h-11 w-full" disabled>
          {unavailableReason}
        </Button>
      </div>
    )
  }

  if (!canAfford) {
    return (
      <div className="mt-8 grid gap-3">
        <p className="text-sm text-muted-foreground">
          내 잔액 <span className="font-medium text-foreground">{balance}P</span> · 필요{" "}
          {points}P
        </p>
        <Button className="h-11 w-full" disabled>
          포인트가 부족해요
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-3">
      <p className="text-sm text-muted-foreground">
        내 잔액 <span className="font-medium text-foreground">{balance}P</span> · 사고 나면{" "}
        {remaining}P
      </p>
      {state?.error ? <FieldError>{state.error}</FieldError> : null}
      <Button type="button" className="h-11 w-full" onClick={() => setConfirming(true)}>
        포인트로 구매
      </Button>

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => !pending && setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-confirm-title"
            className="w-full max-w-md rounded-2xl bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="purchase-confirm-title" className="font-heading text-lg font-semibold">
              {productName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {points}P로 살까요? 잔액이 {balance}P에서 {remaining}P로 바뀌어요. 주문은
              수령 대기고, 교실에서 받아 가면 돼요.
            </p>
            {state?.error ? (
              <div className="mt-3">
                <FieldError>{state.error}</FieldError>
              </div>
            ) : null}
            <form action={formAction} className="mt-5 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="productId" value={productId} />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={pending}
                onClick={() => setConfirming(false)}
              >
                아니요
              </Button>
              <Button type="submit" className="h-11" disabled={pending}>
                {pending ? "구매 중…" : `네, ${points}P로 살게요`}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
