"use client";

import { useState } from "react";
import ProfileSecurityPanel from "./ProfileSecurityPanel";
import OrdersPanel from "./OrdersPanel";
import AddressesPanel from "./AddressesPanel";
import WishlistPanel from "./WishlistPanel";
import type { Database } from "@/lib/database.types";

type Tab = "profile" | "orders" | "addresses" | "wishlist";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type Address = Database["public"]["Tables"]["addresses"]["Row"];
type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Account Details" },
  { id: "orders", label: "Orders & Returns" },
  { id: "addresses", label: "Saved Addresses" },
  { id: "wishlist", label: "Wishlist" },
];

export default function ProfileTabs({
  userId,
  email,
  displayName,
  avatarUrl,
  profile,
  orders,
  addresses,
  favorites,
}: {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  profile: Profile | null;
  orders: Order[];
  addresses: Address[];
  favorites: Favorite[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div>
      <h1 className="font-[family-name:var(--font-editorial)] text-4xl font-semibold tracking-tight mb-10">
        My Account
      </h1>

      <div className="md:grid md:grid-cols-4 md:gap-10">
        <nav className="mb-8 md:mb-0 md:col-span-1">
          <ul className="flex md:flex-col gap-1 overflow-x-auto border-b border-[#E2E1DD] md:border-b-0 pb-2 md:pb-0">
            {TABS.map((tab) => (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full whitespace-nowrap text-left px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] rounded-md transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "bg-[#141414] text-[#FAFAF8]"
                      : "text-[#141414]/55 hover:bg-[#F4F2ED] hover:text-[#141414]"
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="font-[family-name:var(--font-editorial)] text-2xl font-semibold mb-6">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>

          {activeTab === "profile" && (
            <ProfileSecurityPanel
              userId={userId}
              email={email}
              displayName={displayName}
              avatarUrl={avatarUrl}
              profile={profile}
            />
          )}
          {activeTab === "orders" && <OrdersPanel orders={orders} />}
          {activeTab === "addresses" && (
            <AddressesPanel userId={userId} initialAddresses={addresses} />
          )}
          {activeTab === "wishlist" && (
            <WishlistPanel userId={userId} initialFavorites={favorites} />
          )}
        </div>
      </div>
    </div>
  );
}
