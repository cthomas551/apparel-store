"use client";

import { useEffect, useRef, useState } from "react";

type Size = "S" | "M" | "L" | "XL";

type SheetImage = {
  src: string;
  fit?: "cover" | "contain";
};

type SheetProduct = {
  name: string;
  price: string;
  images: SheetImage[];
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
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    const gallery = galleryRef.current;
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
      setSelectedSize(null);
      setActiveImage(0);
      gallery?.scrollTo({ left: 0 });
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

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className={`relative w-full max-w-md md:max-w-lg max-h-[90vh] bg-[#FAFAF8] rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col transition-transform duration-300 ease-out ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="absolute top-2.5 left-0 right-0 z-10 flex justify-center">
          <span className="h-1 w-9 rounded-full bg-[#FAFAF8]/70" />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-[#FAFAF8]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative w-full aspect-[4/5] bg-[#0A0A0A]">
          <div
            ref={galleryRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const index = Math.round(el.scrollLeft / el.clientWidth);
              setActiveImage(index);
            }}
            className="h-full w-full flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {product.images.map((image, i) => (
              <div
                key={image.src + i}
                className="relative h-full w-full shrink-0 snap-start"
                style={{ backgroundColor: image.fit === "contain" ? "#FFFFFF" : "#0A0A0A" }}
              >
                <img
                  src={image.src}
                  alt={`${product.name} — photo ${i + 1} of ${product.images.length}`}
                  className={`h-full w-full ${image.fit === "contain" ? "object-contain" : "object-cover"}`}
                />
              </div>
            ))}
          </div>

          {product.images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <div className="flex gap-1.5 px-2 py-1 rounded-full bg-black/25 backdrop-blur-sm">
                {product.images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeImage ? "w-4 bg-[#FAFAF8]/90" : "w-1.5 bg-[#FAFAF8]/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col gap-6 overflow-y-auto">
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

          <button
            disabled={!selectedSize}
            onClick={() => selectedSize && onAddToBag(selectedSize)}
            className={`h-13 py-3.5 rounded-full text-[11px] tracking-[0.24em] uppercase transition-colors ${
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