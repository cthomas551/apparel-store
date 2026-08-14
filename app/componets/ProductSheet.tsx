"use client";

/**
 * ProductSheet — a sliding bottom-sheet modal for product detail.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ProductSheet
 *     product={product}
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onAddToBag={(size) => { ... }}
 *   />
 *
 * Layout notes:
 * - The whole sheet is capped to 92dvh so it can never grow taller than the
 *   screen, on any browser (in-app or otherwise).
 * - Image + title/size are in a scrollable region; the Add to Bag button
 *   is pinned in its own footer OUTSIDE that scroll area, so it's always
 *   visible no matter how tall the image renders.
 * - Image height is a fixed 38dvh (not an aspect ratio), so it can't grow
 *   taller than intended on narrow/tall phone screens.
 */

import { useEffect, useState } from "react";

type Size = "S" | "M" | "L" | "XL";

type SheetProduct = {
  name: string;
  price: string;
  imageUrl: string;
};

const SIZES: Size[] = ["S", "M", "L", "XL"];

export default function ProductSheet({
  product,
  isOpen,
  onClose,
  onAddToBag,
}: {
  product: SheetProduct;
  isOpen: boolean;
  onClose: () => void;
  onAddToBag: (size: Size) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    }
    setMounted(false);
    setSelectedSize(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sheet — capped to 92dvh, flex column, footer pinned outside scroll */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className={`absolute bottom-0 w-full max-w-md max-h-[92dvh] bg-[#FAFAF8] rounded-t-3xl overflow-hidden flex flex-col transition-transform duration-300 ease-out ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="absolute top-2.5 left-0 right-0 z-10 flex justify-center">
          <span className="h-1 w-9 rounded-full bg-[#FAFAF8]/70" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-[#FAFAF8]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scrollable region: image + details */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="relative w-full h-[38dvh] min-h-[220px] bg-[#0A0A0A]">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="px-6 pt-5 pb-6 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl leading-snug text-[#141414]">
                {product.name}
              </h2>
              <span className="pt-1 text-[13px] tracking-widest text-[#141414]/70 whitespace-nowrap">
                {product.price}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] tracking-[0.24em] uppercase text-[#141414]/50">
                Size
              </span>
              <div className="flex gap-2.5">
                {SIZES.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={active}
                      className={`h-11 flex-1 rounded-full border text-[13px] tracking-wide transition-colors ${
                        active
                          ? "border-[#141414] bg-[#141414] text-[#FAFAF8]"
                          : "border-[#E2E1DD] text-[#141414]/80 hover:border-[#141414]/40"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pinned footer — outside the scroll area, always visible */}
        <div className="shrink-0 border-t border-[#E2E1DD] px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[#FAFAF8]">
          <button
            disabled={!selectedSize}
            onClick={() => selectedSize && onAddToBag(selectedSize)}
            className={`w-full h-13 py-3.5 rounded-full text-[11px] tracking-[0.24em] uppercase transition-colors ${
              selectedSize
                ? "bg-[#141414] text-[#FAFAF8] hover:bg-[#141414]/90"
                : "bg-[#141414]/15 text-[#141414]/40 cursor-not-allowed"
            }`}
          >
            {selectedSize ? "Add to Bag" : "Select a size"}
          </button>
        </div>
      </div>
    </div>
  );
}
