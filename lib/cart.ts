import type { CartItem } from "@/app/componets/CartModal";
import type { Product } from "./products";

// Shared by the "add to bag" flow and by loading a persisted cart_items
// row back into a CartItem, so price/image derivation only lives here.
export function resolveCartItem(products: Product[], variantId: string, quantity: number): CartItem | null {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      return {
        key: `${product.id}-${variant.size}`,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        size: variant.size,
        price: Number(product.price.replace(/[^0-9.]/g, "")) || 0,
        imageUrl: product.imageUrl ?? `https://picsum.photos/seed/marrow-${product.id}/900/1125`,
        quantity,
      };
    }
  }
  return null;
}
