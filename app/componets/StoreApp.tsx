"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import ProductSheet from "./ProductSheet";
import CartModal, { type CartItem } from "./CartModal";
import { PRODUCTS, type Category, type Product } from "@/lib/products";

function GarmentArt({ category }: { category: Category }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (category) {
    case "coat":
      return (
        <svg viewBox="0 0 200 260" className="h-56 w-auto text-[#141414]/70" {...common}>
          <path d="M70 40 L100 60 L130 40 L150 55 L138 90 L128 82 L128 220 L72 220 L72 82 L62 90 L50 55 Z" />
          <path d="M100 60 L100 220" strokeDasharray="2 6" />
          <path d="M78 100 L60 220" />
          <path d="M122 100 L140 220" />
        </svg>
      );
    case "dress":
      return (
        <svg viewBox="0 0 200 260" className="h-56 w-auto text-[#141414]/70" {...common}>
          <path d="M85 35 L100 50 L115 35 L124 60 L112 68 L120 220 L80 220 L88 68 L76 60 Z" />
          <path d="M88 68 L112 68" />
          <circle cx="100" cy="42" r="6" />
        </svg>
      );
    case "trouser":
      return (
        <svg viewBox="0 0 200 260" className="h-56 w-auto text-[#141414]/70" {...common}>
          <path d="M75 40 L125 40 L130 220 L108 220 L100 100 L92 220 L70 220 Z" />
          <path d="M75 55 L125 55" />
        </svg>
      );
    case "shirt":
      return (
        <svg viewBox="0 0 200 260" className="h-56 w-auto text-[#141414]/70" {...common}>
          <path d="M78 38 L100 55 L122 38 L148 58 L134 82 L124 74 L124 210 L76 210 L76 74 L66 82 L52 58 Z" />
          <path d="M100 55 L100 210" strokeDasharray="2 6" />
        </svg>
      );
    case "knit":
      return (
        <svg viewBox="0 0 200 260" className="h-56 w-auto text-[#141414]/70" {...common}>
          <path d="M80 45 L100 58 L120 45 L142 62 L130 84 L120 76 L120 200 L80 200 L80 76 L70 84 L58 62 Z" />
          <path d="M84 100 L116 100 M84 120 L116 120 M84 140 L116 140 M84 160 L116 160" />
        </svg>
      );
  }
}

function IconSearch({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.4}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20 L15.2 15.2" strokeLinecap="round" />
    </svg>
  );
}

function IconHome({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path d="M4 11.5 L12 4 L20 11.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10 V20 H17.5 V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x="4" y="4" width="7" height="7" rx="0.5" />
      <rect x="13" y="4" width="7" height="7" rx="0.5" />
      <rect x="4" y="13" width="7" height="7" rx="0.5" />
      <rect x="13" y="13" width="7" height="7" rx="0.5" />
    </svg>
  );
}

function IconBag({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path d="M6.5 8.5 H17.5 L17 20 H7 Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8.5 V6.5 A3 3 0 0 1 15 6.5 V8.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.4}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20 C5 15.5 8 13 12 13 C16 13 19 15.5 19 20" strokeLinecap="round" />
    </svg>
  );
}

type Tab = "home" | "collection" | "bag";

export default function StoreApp() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [activeIndex, setActiveIndex] = useState(0);
  const [bagItems, setBagItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const bagCount = bagItems.reduce((sum, item) => sum + item.quantity, 0);

  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = feedRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = cardRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { root, threshold: [0.6] }
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="md:hidden min-h-dvh w-full bg-[#F4F2ED] flex justify-center">
        <div className="relative w-full max-w-md h-dvh bg-[#FAFAF8] text-[#141414] overflow-hidden">
          <header
            className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-6 pb-4 transition-colors ${
              PRODUCTS[activeIndex]?.imageUrl && PRODUCTS[activeIndex]?.imageFit !== "contain"
                ? "bg-transparent text-[#FAFAF8]"
                : "bg-[#FAFAF8]/90 backdrop-blur-sm text-[#141414]"
            }`}
          >
            <span className="font-serif text-[15px] tracking-[0.32em] uppercase">
              Marrow
            </span>
            <button aria-label="Search" className="opacity-80 hover:opacity-100 transition-opacity">
              <IconSearch />
            </button>
          </header>

          <main
            ref={feedRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {PRODUCTS.map((product, i) => {
              const hasPhoto = !!product.imageUrl;
              const isContain = product.imageFit === "contain";
              const darkHero = hasPhoto && !isContain;

              return (
              <section
                key={product.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="relative h-full w-full snap-start overflow-hidden"
                style={{
                  backgroundColor: hasPhoto ? (isContain ? "#FAFAF8" : "#0A0A0A") : product.tone,
                }}
              >
                {hasPhoto ? (
                  <>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className={`absolute inset-0 h-full w-full ${isContain ? "object-contain" : "object-cover"} ${
                        product.monochrome === false
                          ? ""
                          : "grayscale contrast-[1.08] brightness-[0.92]"
                      }`}
                    />
                    {darkHero && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 via-30% to-transparent to-60%" />
                    )}
                  </>
                ) : null}

                <button
                  onClick={() => setSelectedProduct(product)}
                  aria-label={`View ${product.name}`}
                  className={`relative z-10 h-full w-full flex flex-col items-center justify-center px-8 pt-16 pb-24 gap-4 text-left ${
                    darkHero ? "text-[#FAFAF8]" : "text-[#141414]"
                  }`}
                >
                  {!hasPhoto && <GarmentArt category={product.category} />}

                  <div
                    className={`flex flex-col items-center gap-2 text-center ${
                      darkHero ? "mt-auto" : ""
                    }`}
                  >
                    <span
                      className={`text-[11px] tracking-[0.28em] uppercase ${
                        darkHero ? "text-[#FAFAF8]/65" : "text-[#141414]/50"
                      }`}
                    >
                      {product.categoryLabel}
                    </span>
                    <h2 className="font-serif text-2xl leading-snug">{product.name}</h2>
                    <span
                      className={`text-[13px] tracking-widest ${
                        darkHero ? "text-[#FAFAF8]/85" : "text-[#141414]/70"
                      }`}
                    >
                      {product.price}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] tracking-[0.2em] uppercase ${
                      darkHero ? "text-[#FAFAF8]/45" : "text-[#141414]/35"
                    }`}
                  >
                    Tap to view
                  </span>
                </button>
              </section>
              );
            })}
          </main>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2">
            {PRODUCTS.map((_, i) => {
              const activeDark =
                !!PRODUCTS[activeIndex]?.imageUrl && PRODUCTS[activeIndex]?.imageFit !== "contain";
              return (
                <span
                  key={i}
                  className={`w-[3px] rounded-full transition-all duration-300 ${
                    activeDark
                      ? i === activeIndex
                        ? "h-4 bg-[#FAFAF8]/90"
                        : "h-2 bg-[#FAFAF8]/35"
                      : i === activeIndex
                        ? "h-4 bg-[#141414]/80"
                        : "h-2 bg-[#141414]/25"
                  }`}
                />
              );
            })}
          </div>

          <div
            className={`absolute left-6 bottom-24 z-20 text-[11px] tracking-[0.2em] transition-colors ${
              PRODUCTS[activeIndex]?.imageUrl && PRODUCTS[activeIndex]?.imageFit !== "contain"
                ? "text-[#FAFAF8]/70"
                : "text-[#141414]/50"
            }`}
          >
            {String(activeIndex + 1).padStart(2, "0")} / {String(PRODUCTS.length).padStart(2, "0")}
          </div>

          <nav className="absolute bottom-0 left-0 right-0 z-20 bg-[#FAFAF8]/95 backdrop-blur-sm border-t border-[#E2E1DD]">
            <div className="flex items-center justify-around py-4">
              <NavButton
                label="Home"
                active={activeTab === "home"}
                onClick={() => setActiveTab("home")}
                icon={<IconHome />}
              />
              <NavButton
                label="Collection"
                active={activeTab === "collection"}
                onClick={() => setActiveTab("collection")}
                icon={<IconGrid />}
              />
              <NavButton
                label="Bag"
                active={activeTab === "bag"}
                onClick={() => {
                  setActiveTab("bag");
                  setCartOpen(true);
                }}
                icon={<IconBag />}
                badge={bagCount > 0 ? bagCount : undefined}
              />
              <NavButton
                label="Profile"
                active={false}
                href={user ? "/profile" : "/login"}
                icon={<IconUser />}
              />
            </div>
          </nav>
        </div>
      </div>

      <div className="hidden md:block min-h-screen w-full bg-[#FAFAF8] text-[#141414]">
        <header className="sticky top-0 z-30 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E2E1DD]">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 h-20 flex items-center justify-between">
            <span className="font-serif text-lg tracking-[0.32em] uppercase">Marrow</span>

            <nav className="flex items-center gap-10">
              <button
                onClick={() => setActiveTab("home")}
                className={`text-[11px] tracking-[0.24em] uppercase transition-colors ${
                  activeTab === "home" ? "text-[#141414]" : "text-[#141414]/45 hover:text-[#141414]/70"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab("collection")}
                className={`text-[11px] tracking-[0.24em] uppercase transition-colors ${
                  activeTab === "collection" ? "text-[#141414]" : "text-[#141414]/45 hover:text-[#141414]/70"
                }`}
              >
                Collection
              </button>
            </nav>

            <div className="flex items-center gap-6">
              <button
                aria-label="Search"
                className="text-[#141414]/70 hover:text-[#141414] transition-colors"
              >
                <IconSearch />
              </button>
              <Link
                href={user ? "/profile" : "/login"}
                aria-label={user ? "Profile" : "Log in"}
                className="text-[#141414]/70 hover:text-[#141414] transition-colors"
              >
                <IconUser />
              </Link>
              <button
                aria-label="Bag"
                onClick={() => {
                  setActiveTab("bag");
                  setCartOpen(true);
                }}
                className="relative text-[#141414]/70 hover:text-[#141414] transition-colors"
              >
                <IconBag />
                {bagCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-[#141414] text-[#FAFAF8] text-[9px] leading-4 text-center">
                    {bagCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 lg:px-12 py-12">
          <h1 className="font-serif text-3xl mb-10">
            {activeTab === "collection" ? "Collection" : "New Arrivals"}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {PRODUCTS.map((product) => {
              const isContain = product.imageFit === "contain";
              return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group flex flex-col gap-4 text-left"
              >
                <div
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: product.imageUrl
                      ? isContain
                        ? "#FAFAF8"
                        : "#0A0A0A"
                      : product.tone,
                  }}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className={`h-full w-full ${isContain ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-105 ${
                        product.monochrome === false
                          ? ""
                          : "grayscale contrast-[1.08] brightness-[0.92]"
                      }`}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <GarmentArt category={product.category} />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] tracking-[0.24em] uppercase text-[#141414]/45">
                    {product.categoryLabel}
                  </span>
                  <span className="font-serif text-lg leading-snug">{product.name}</span>
                  <span className="text-[13px] tracking-wide text-[#141414]/70">{product.price}</span>
                </div>
              </button>
              );
            })}
          </div>
        </main>
      </div>

      {selectedProduct && (
        <ProductSheet
          product={{
            name: selectedProduct.name,
            price: selectedProduct.price,
            description: selectedProduct.description,
            details: selectedProduct. details,
            images:
              selectedProduct.gallery ??
              [
                {
                  src:
                    selectedProduct.imageUrl ??
                    `https://picsum.photos/seed/marrow-${selectedProduct.id}/900/1125`,
                  fit: selectedProduct.imageFit,
                },
              ],
          }}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToBag={(size) => {
            const product = selectedProduct;
            const key = `${product.id}-${size}`;
            const imageUrl =
              product.imageUrl ?? `https://picsum.photos/seed/marrow-${product.id}/900/1125`;
            const price = Number(product.price.replace(/[^0-9.]/g, "")) || 0;

            setBagItems((prev) => {
              const existing = prev.find((item) => item.key === key);
              if (existing) {
                return prev.map((item) =>
                  item.key === key ? { ...item, quantity: item.quantity + 1 } : item
                );
              }
              return [
                ...prev,
                { key, name: product.name, size, price, imageUrl, quantity: 1 },
              ];
            });

            setSelectedProduct(null);
          }}
        />
      )}

      <CartModal
        items={bagItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={(key, quantity) =>
          setBagItems((prev) =>
            prev.map((item) => (item.key === key ? { ...item, quantity } : item))
          )
        }
        onRemove={(key) => setBagItems((prev) => prev.filter((item) => item.key !== key))}
        isCheckingOut={checkingOut}
        onCheckout={async () => {
          setCheckingOut(true);
          try {
            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: bagItems }),
            });
            const data = await res.json();

            if (!res.ok || !data.url) {
              throw new Error(data.error ?? "Checkout failed to start.");
            }

            window.location.href = data.url;
          } catch (err) {
            console.error(err);
            alert("Something went wrong starting checkout. Please try again.");
          } finally {
            setCheckingOut(false);
          }
        }}
      />
    </>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
  href,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  href?: string;
  badge?: number;
}) {
  const className = `relative flex flex-col items-center gap-1.5 transition-colors ${
    active ? "text-[#141414]" : "text-[#141414]/40"
  }`;

  const content = (
    <>
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-2 h-3.5 w-3.5 rounded-full bg-[#141414] text-[#FAFAF8] text-[9px] leading-[14px] text-center">
          {badge}
        </span>
      )}
      <span className="text-[9px] tracking-[0.2em] uppercase">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
