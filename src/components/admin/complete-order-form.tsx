"use client"

import { useActionState, useState } from "react"

import {
  completeOrderAction,
  type AdminOrderState,
} from "@/app/admin/orders/actions"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

type CompleteOrderFormProps = {
  orderId: string
  productName: string
  studentName: string
}

export function CompleteOrderForm({
  orderId,
  productName,
  studentName,
}: CompleteOrderFormProps) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState<AdminOrderState, FormData>(
    completeOrderAction,
    undefined
  )

  return (
    <div className="grid justify-items-end gap-2">
      {state?.error ? <FieldError>{state.error}</FieldError> : null}
      <Button
        type="button"
        size="sm"
        className="h-8"
        onClick={() => setConfirming(true)}
      >
        수령 완료
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
            aria-labelledby={`complete-order-${orderId}`}
            className="w-full max-w-md rounded-2xl bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={`complete-order-${orderId}`}
              className="font-heading text-lg font-semibold"
            >
              {productName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {studentName} 학생이 교실에서 받아 갔나요? 수령 완료로 바꾸면 학생은
              이 주문을 취소할 수 없어요.
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
              <Button type="submit" className="h-11" disabled={pending}>
                {pending ? "처리 중…" : "네, 받아 갔어요"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
