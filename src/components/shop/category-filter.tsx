import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type ProductCategory,
} from "@/lib/catalog"
import { cn } from "@/lib/utils"

type CategoryFilterProps = {
  active: ProductCategory | "all"
}

export function CategoryFilter({ active }: CategoryFilterProps) {
  const items: Array<{ value: ProductCategory | "all"; label: string; href: string }> = [
    { value: "all", label: "전체", href: "/" },
    ...CATEGORIES.map((category) => ({
      value: category,
      label: CATEGORY_LABEL[category],
      href: `/?category=${category}`,
    })),
  ]

  return (
    <nav aria-label="카테고리" className="mt-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = item.value === active

        return (
          <Link
            key={item.value}
            href={item.href}
            className={cn(
              buttonVariants({ variant: selected ? "default" : "outline", size: "sm" }),
              "rounded-full"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
