"use client"

import { useActionState } from "react"

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/app/admin/products/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CONDITION_LABEL,
  CONDITIONS,
  SALE_STATUS_LABEL,
  SALE_STATUSES,
} from "@/lib/catalog"
import type { ProductRecord } from "@/lib/products"

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

type ProductFormProps = {
  product?: ProductRecord
}

export function ProductForm({ product }: ProductFormProps) {
  const action = product ? updateProductAction : createProductAction
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    action,
    undefined
  )

  return (
    <form action={formAction} className="grid gap-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">상품 이름</FieldLabel>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            className="h-11 text-base"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="image">대표 사진</FieldLabel>
          {product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="mb-2 h-36 w-36 rounded-lg object-cover ring-1 ring-foreground/10"
            />
          ) : null}
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="h-11 pt-1.5"
            required={!product}
          />
          <FieldDescription>
            1장만. JPG·PNG·WEBP, 2MB 이하. 수정 시 비워 두면 기존 사진을 유지해요.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="category">카테고리</FieldLabel>
          <select
            id="category"
            name="category"
            defaultValue={product?.category ?? "other"}
            className={selectClassName}
            required
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="condition">컨디션</FieldLabel>
            <select
              id="condition"
              name="condition"
              defaultValue={product?.condition ?? "good"}
              className={selectClassName}
              required
            >
              {CONDITIONS.map((value) => (
                <option key={value} value={value}>
                  {CONDITION_LABEL[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="saleStatus">판매 상태</FieldLabel>
            <select
              id="saleStatus"
              name="saleStatus"
              defaultValue={product?.saleStatus ?? "on_sale"}
              className={selectClassName}
              required
            >
              {SALE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {SALE_STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="points">구매 포인트</FieldLabel>
            <Input
              id="points"
              name="points"
              type="number"
              min={1}
              step={1}
              defaultValue={product?.points ?? 10}
              className="h-11 text-base"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="quantity">수량</FieldLabel>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.quantity ?? 1}
              className="h-11 text-base"
              required
            />
          </Field>
        </div>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
      </FieldGroup>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? "저장 중…" : product ? "수정 저장" : "상품 올리기"}
        </Button>
        {product ? (
          <Button
            type="submit"
            variant="destructive"
            className="h-11"
            formAction={deleteProductAction}
            onClick={(event) => {
              if (!window.confirm("이 상품을 삭제할까요?")) {
                event.preventDefault()
              }
            }}
          >
            삭제
          </Button>
        ) : null}
      </div>
    </form>
  )
}
