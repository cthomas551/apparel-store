import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type Category = "coat" | "dress" | "trouser" | "shirt" | "knit" | "streetwear" | "short set";

export type GalleryImage = { src: string; fit?: "cover" | "contain"; isModelShot?: boolean };

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  price: string;
  tone: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain";
  gallery?: GalleryImage[];
  description?: string;
  details?: { label: string; value: string }[];
  variants: ProductVariant[];
  rating: { average: number; count: number } | null;
};

// Maps the database's category taxonomy (categories.slug) to the
// short internal value the storefront uses for filter buttons and the
// no-photo fallback icon, plus the label actually shown to shoppers.
const CATEGORY_MAP: Record<string, { category: Category; categoryLabel: string }> = {
  "short-set": { category: "short set", categoryLabel: "Short Set" },
  shirting: { category: "shirt", categoryLabel: "Shirting" },
  knitwear: { category: "knit", categoryLabel: "Knitwear" },
  outerwear: { category: "coat", categoryLabel: "Outerwear" },
  dresses: { category: "dress", categoryLabel: "Dresses" },
  trousers: { category: "trouser", categoryLabel: "Trousers" },
  menswear: { category: "shirt", categoryLabel: "Menswear" },
};

export async function getActiveProducts(supabase: SupabaseClient<Database>): Promise<Product[]> {
  const [{ data: products }, { data: images }, { data: variants }, { data: categories }, { data: reviews }] =
    await Promise.all([
      supabase.from("products").select("*").eq("status", "active").order("name"),
      supabase.from("product_images").select("*").order("sort_order"),
      supabase.from("product_variants").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("product_reviews").select("product_id, rating"),
    ]);

  if (!products) return [];

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  const ratingByProductId = new Map<string, { total: number; count: number }>();
  for (const r of reviews ?? []) {
    const entry = ratingByProductId.get(r.product_id) ?? { total: 0, count: 0 };
    entry.total += r.rating;
    entry.count += 1;
    ratingByProductId.set(r.product_id, entry);
  }

  return products.map((p): Product => {
    const category = p.category_id ? categoryById.get(p.category_id) : undefined;
    const mapped = category ? CATEGORY_MAP[category.slug] : undefined;

    const gallery: GalleryImage[] = (images ?? [])
      .filter((img) => img.product_id === p.id)
      .map((img) => ({
        src: img.url,
        fit: img.fit ?? undefined,
        isModelShot: img.is_model_shot,
      }));

    const cover = gallery[0];

    const productVariants: ProductVariant[] = (variants ?? [])
      .filter((v) => v.product_id === p.id)
      .map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stockQuantity: v.stock_quantity,
      }));

    const ratingEntry = ratingByProductId.get(p.id);

    return {
      id: p.id,
      name: p.name,
      category: mapped?.category ?? "shirt",
      categoryLabel: mapped?.categoryLabel ?? category?.name ?? "Other",
      price: `$${Math.round(Number(p.base_price))}`,
      tone: p.tone ?? "#EDEBE5",
      imageUrl: cover?.src,
      imageFit: cover?.fit,
      gallery: gallery.length > 0 ? gallery : undefined,
      description: p.description ?? undefined,
      details: (p.details as { label: string; value: string }[] | null) ?? undefined,
      variants: productVariants,
      rating: ratingEntry ? { average: ratingEntry.total / ratingEntry.count, count: ratingEntry.count } : null,
    };
  });
}
