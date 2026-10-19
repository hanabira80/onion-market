import type { ProductCategory, ProductCondition, SaleStatus } from "@/lib/catalog"
import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import { createServiceClient, isSupabaseConfigured, throwIfError } from "@/lib/supabase"

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

export type ProductInput = Omit<ProductRecord, "id" | "createdAt" | "updatedAt">

type ProductRow = {
  id: string
  name: string
  image_url: string | null
  condition: ProductCondition
  sale_status: SaleStatus
  points: number
  quantity: number
  category: ProductCategory
  created_at: string
  updated_at: string
}

const FILE = "products.json"

function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    condition: row.condition,
    saleStatus: row.sale_status,
    points: row.points,
    quantity: row.quantity,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    image_url: input.imageUrl,
    condition: input.condition,
    sale_status: input.saleStatus,
    points: input.points,
    quantity: input.quantity,
    category: input.category,
  }
}

async function readAllLocal(): Promise<ProductRecord[]> {
  const parsed = await readJsonFile<ProductRecord[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

async function writeAllLocal(products: ProductRecord[]) {
  await writeJsonFile(FILE, products)
}

export async function listProducts() {
  if (!isSupabaseConfigured()) {
    const products = await readAllLocal()
    return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
  throwIfError(error)
  return ((data ?? []) as ProductRow[]).map(mapProduct)
}

export async function getProductById(id: string) {
  if (!isSupabaseConfigured()) {
    const products = await readAllLocal()
    return products.find((product) => product.id === id) ?? null
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  throwIfError(error)
  return data ? mapProduct(data as ProductRow) : null
}

export async function getProductStats() {
  const products = await listProducts()
  return {
    total: products.length,
    onSale: products.filter(
      (product) => product.saleStatus === "on_sale" && product.quantity > 0
    ).length,
  }
}

export async function createProduct(input: ProductInput) {
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const products = await readAllLocal()
      const now = new Date().toISOString()
      const product: ProductRecord = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      products.push(product)
      await writeAllLocal(products)
      return product
    })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input))
    .select("*")
    .single()
  throwIfError(error)
  return mapProduct(data as ProductRow)
}

export async function updateProduct(id: string, input: ProductInput) {
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const products = await readAllLocal()
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
      await writeAllLocal(products)
      return product
    })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .update({
      ...toRow(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  throwIfError(error)
  return data ? mapProduct(data as ProductRow) : null
}

export async function deleteProduct(id: string) {
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const products = await readAllLocal()
      const next = products.filter((product) => product.id !== id)

      if (next.length === products.length) {
        return false
      }

      await writeAllLocal(next)
      return true
    })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()
  throwIfError(error)
  return Boolean(data)
}
