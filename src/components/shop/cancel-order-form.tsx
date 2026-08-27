"use client"

import { useActionState, useState } from "react"

import { cancelOrderAction, type MeActionState } from "@/app/me/actions"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

type CancelOrderFormProps = {
  orderId: string
  productName: string
  points: number
}

export function CancelOrderForm({
  orderId,
  productName,
  points,
}: CancelOrderFormProps) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState<MeActionState, FormData>(
    cancelOrderAction,
    undefined
  )

  return (
    <div className="grid justify-items-end gap-2">
      {state?.error ? <FieldError>{state.error}</FieldError> : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => setConfirming(true)}
      >
        취소
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
            aria-labelledby={`cancel-order-${orderId}`}
            className="w-full max-w-md rounded-2xl bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={`cancel-order-${orderId}`}
              className="font-heading text-lg font-semibold"
            >
              {productName} 주문을 취소할까요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              수령 전에만 취소할 수 있어요. {points}P와 재고가 바로 돌아옵니다.
            </p>
            {state?.error ? (
              <div className="mt-3">
                <FieldError>{state.error}</FieldError>
              </div>
            ) : null}
            <form action={formAction} className="mt-5 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="orderId" value={orderId} />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={pending}
                onClick={() => setConfirming(false)}
              >
                아니요
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="h-11"
                disabled={pending}
              >
                {pending ? "취소 중…" : "네, 취소할게요"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
