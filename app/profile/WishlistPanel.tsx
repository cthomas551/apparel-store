"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCTS, type Product } from "@/lib/products";
import type { Database } from "@/lib/database.types";

type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

export default function WishlistPanel({
  userId,
  initialFavorites,
}: {
  userId: string;
  initialFavorites: Favorite[];
}) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  const favoritedIds = new Set(favorites.map((f) => f.product_id));
  const savedProducts = favorites
    .map((f) => PRODUCTS.find((p) => p.id === f.product_id))
    .filter((p): p is Product => Boolean(p));
  const availableToAdd = PRODUCTS.filter((p) => !favoritedIds.has(p.id));

  async function handleAdd(productId: string) {
    if (!productId) return;
    setAdding(true);

    const { data, error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (!error && data) {
      setFavorites((prev) => [...prev, data]);
    }
    setAdding(false);
  }

  async function handleRemove(productId: string) {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId);
    setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
  }

  return (
    <div className="flex flex-col gap-5">
      {availableToAdd.length > 0 && (
        <select
          disabled={adding}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) handleAdd(e.target.value);
            e.target.value = "";
          }}
          className="self-start rounded-md border border-[#E2E1DD] bg-white px-3 py-2 text-[12px] uppercase tracking-[0.1em] text-[#141414]/70 transition-colors duration-200 focus:outline-none focus:border-[#141414] hover:border-[#141414]/40"
        >
          <option value="" disabled>
            + Add a product to your wishlist
          </option>
          {availableToAdd.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.price}
            </option>
          ))}
        </select>
      )}

      {savedProducts.length === 0 ? (
        <p className="text-[14px] text-[#141414]/55">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {savedProducts.map((product) => (
            <div key={product.id} className="flex flex-col gap-2">
              <div
                className="relative aspect-[4/5] rounded-xl overflow-hidden"
                style={{ backgroundColor: product.imageUrl ? "#0A0A0A" : product.tone }}
              >
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-[#141414] transition-colors duration-200 hover:bg-white"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#141414]">{product.name}</p>
                <p className="text-[12px] text-[#141414]/55 mt-0.5">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
