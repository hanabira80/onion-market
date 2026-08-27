import type { ProductCategory, ProductCondition, SaleStatus } from "@/lib/catalog"
import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"

export type ProductRecord = {
  id: string
  name: string
  imageUrl: string | null
  condition: ProductCondition
  saleStatus: SaleStatus
  points: number
  quantity: number
  category: ProductCategory
  createdAt: string
  updatedAt: string
}

const FILE = "products.json"

async function readAll(): Promise<ProductRecord[]> {
  const parsed = await readJsonFile<ProductRecord[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

async function writeAll(products: ProductRecord[]) {
  await writeJsonFile(FILE, products)
}

export async function listProducts() {
  const products = await readAll()
  return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getProductById(id: string) {
  const products = await readAll()
  return products.find((product) => product.id === id) ?? null
}

export async function getProductStats() {
  const products = await readAll()
  return {
    total: products.length,
    onSale: products.filter(
      (product) => product.saleStatus === "on_sale" && product.quantity > 0
    ).length,
  }
}

export type ProductInput = Omit<ProductRecord, "id" | "createdAt" | "updatedAt">

export async function createProduct(input: ProductInput) {
  return withLock(async () => {
    const products = await readAll()
    const now = new Date().toISOString()
    const product: ProductRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    products.push(product)
    await writeAll(products)
    return product
  })
}

export async function updateProduct(id: string, input: ProductInput) {
  return withLock(async () => {
    const products = await readAll()
    const index = products.findIndex((product) => product.id === id)

    if (index === -1) {
      return null
    }

    const product: ProductRecord = {
      ...products[index],
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    }
    products[index] = product
    await writeAll(products)
    return product
  })
}

export async function deleteProduct(id: string) {
  return withLock(async () => {
    const products = await readAll()
    const next = products.filter((product) => product.id !== id)

    if (next.length === products.length) {
      return false
    }

    await writeAll(next)
    return true
  })
}
