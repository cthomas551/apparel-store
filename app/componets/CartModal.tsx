"use client";

import { useEffect, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

export default function CartModal({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isCheckingOut = false,
}: {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
  isCheckingOut?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
      setMounted(false);
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

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
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
        aria-label="Your bag"
        className={`absolute bottom-0 w-full max-w-md h-[85%] bg-[#FAFAF8] rounded-t-3xl overflow-hidden flex flex-col transition-transform duration-300 ease-out ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="pt-2.5 flex justify-center shrink-0">
          <span className="h-1 w-9 rounded-full bg-[#141414]/15" />
        </div>

        <div className="px-6 pt-4 pb-3 flex items-center justify-between shrink-0">
          <h2 className="font-serif text-xl text-[#141414]">Your Bag</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#141414]/60 hover:text-[#141414]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <p className="text-[13px] tracking-wide text-[#141414]/45">Your bag is empty.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-[#E2E1DD]">
            {items.map((item) => (
              <div key={item.key} className="py-4 flex gap-4">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-20 w-16 rounded-lg object-cover grayscale contrast-[1.08] brightness-[0.92] shrink-0"
                />

                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-serif text-[15px] text-[#141414] leading-snug truncate">
                      {item.name}
                    </span>
                    <span className="text-[13px] tracking-wide text-[#141414]/70 whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-[#141414]/45">
                    Size {item.size}
                  </span>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 border border-[#E2E1DD] rounded-full px-1">
                      <button
                        onClick={() =>
                          item.quantity <= 1
                            ? onRemove(item.key)
                            : onUpdateQuantity(item.key, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="h-6 w-6 flex items-center justify-center text-[#141414]/70"
                      >
                        −
                      </button>
                      <span className="text-[12px] text-[#141414] w-3 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="h-6 w-6 flex items-center justify-center text-[#141414]/70"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemove(item.key)}
                      className="text-[10px] tracking-[0.18em] uppercase text-[#141414]/35 hover:text-[#141414]/60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-[#E2E1DD] shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.24em] uppercase text-[#141414]/50">
                Subtotal
              </span>
              <span className="text-[15px] tracking-wide text-[#141414]">
                ${subtotal.toFixed(0)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              disabled={isCheckingOut}
              className={`h-13 py-3.5 rounded-full text-[11px] tracking-[0.24em] uppercase transition-colors ${
                isCheckingOut
                  ? "bg-[#141414]/40 text-[#FAFAF8] cursor-not-allowed"
                  : "bg-[#141414] text-[#FAFAF8] hover:bg-[#141414]/90"
              }`}
            >
              {isCheckingOut ? "Redirecting…" : "Checkout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
