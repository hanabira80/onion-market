import type { ProductCategory, ProductCondition, SaleStatus } from "@/lib/catalog"
import { createServiceClient, throwIfError } from "@/lib/supabase"

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

export async function listProducts() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
  throwIfError(error)
  return ((data ?? []) as ProductRow[]).map(mapProduct)
}

export async function getProductById(id: string) {
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

export type ProductInput = Omit<ProductRecord, "id" | "createdAt" | "updatedAt">

export async function createProduct(input: ProductInput) {
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
