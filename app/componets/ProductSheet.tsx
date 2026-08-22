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
 *   screen, on any browser (in-app or otherwise) — this was the root cause
 *   of the "image too big, button cut off" bug.
 * - Image gallery + description/details/size are in a scrollable region;
 *   the Add to Bag button is pinned in its own footer OUTSIDE that scroll
 *   area, so it's always visible no matter how tall the gallery renders.
 * - Gallery image height is a fixed 38dvh (not an aspect ratio), so it
 *   can't grow taller than intended on narrow/tall phone screens.
 */

import { useRef, useState, useEffect } from "react";

type Size = "S" | "M" | "L" | "XL";

// Accepts either `url` or `src` since the exact field name from the
// original gallery type wasn't visible when this was rebuilt — both are
// checked at render time.
type GalleryImage = {
  url?: string;
  src?: string;
  alt?: string;
  isModelShot?: boolean;
};

type ProductDetail = {
  label: string;
  value: string;
};

type SheetProduct = {
  name: string;
  price: string;
  images: GalleryImage[];
  description?: string;
  details?: ProductDetail[];
};

type SheetVariant = {
  size: string;
  stockQuantity: number;
};

function IconHeart({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        d="M12 20.5 C12 20.5 3.5 15.2 3.5 9.2 C3.5 6.1 5.9 3.8 8.8 3.8 C10.4 3.8 11.5 4.6 12 5.4 C12.5 4.6 13.6 3.8 15.2 3.8 C18.1 3.8 20.5 6.1 20.5 9.2 C20.5 15.2 12 20.5 12 20.5 Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SIZES: Size[] = ["S", "M", "L", "XL"];

function imgSrc(img: GalleryImage): string {
  return img.url ?? img.src ?? "";
}

export default function ProductSheet({
  product,
  variants,
  isOpen,
  onClose,
  onAddToBag,
  isFavorite,
  onToggleFavorite,
}: {
  product: SheetProduct;
  variants?: SheetVariant[];
  isOpen: boolean;
  onClose: () => void;
  onAddToBag: (size: Size) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
      setSelectedSize(null);
      setActiveImage(0);
    };
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

  // Model/lifestyle photos are excluded from the drawer -- it only shows the
  // standalone product images (e.g. tee, shorts), never the person wearing them.
  const images = (product.images ?? []).filter((img) => !img.isModelShot);

  function handleGalleryScroll() {
    const el = galleryRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImage(index);
  }

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

        {/* Save to wishlist */}
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={isFavorite}
            className={`absolute top-4 left-4 z-10 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-colors ${
              isFavorite ? "text-red-400" : "text-[#FAFAF8] hover:text-red-300"
            }`}
          >
            <IconHeart filled={!!isFavorite} />
          </button>
        )}

        {/* Scrollable region: gallery + description + details + size */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Image gallery — fixed height, horizontal snap-scroll, dot indicators */}
          <div className="relative w-full h-[38dvh] min-h-[220px] bg-[#0A0A0A]">
            <div
              ref={galleryRef}
              onScroll={handleGalleryScroll}
              className="h-full w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {images.map((img, i) => (
                <div key={i} className="relative h-full w-full flex-shrink-0 snap-center">
                  <img
                    src={imgSrc(img)}
                    alt={img.alt ?? product.name}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                </div>
              ))}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeImage ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
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

            {product.description && (
              <p className="text-[14px] leading-relaxed text-[#141414]/70">
                {product.description}
              </p>
            )}

            {product.details && product.details.length > 0 && (
              <div className="grid grid-cols-3 gap-2 border-y border-[#E2E1DD] py-3">
                {product.details.map((d, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[12px] text-[#141414]/70">{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] tracking-[0.24em] uppercase text-[#141414]/50">
                Size
              </span>
              <div className="flex gap-2.5">
                {SIZES.map((size) => {
                  const active = selectedSize === size;
                  // No variants prop means availability isn't known yet
                  // (e.g. still loading) -- default to available rather
                  // than blocking every size.
                  const available = !variants || variants.some((v) => v.size === size && v.stockQuantity > 0);
                  return (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      aria-pressed={active}
                      aria-disabled={!available}
                      className={`h-11 flex-1 rounded-full border text-[13px] tracking-wide transition-colors ${
                        !available
                          ? "border-[#E2E1DD] text-[#141414]/25 cursor-not-allowed line-through"
                          : active
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
