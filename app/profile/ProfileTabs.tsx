"use client";

import { useState } from "react";
import ProfileSecurityPanel from "./ProfileSecurityPanel";
import OrdersPanel from "./OrdersPanel";
import AddressesPanel from "./AddressesPanel";
import WishlistPanel from "./WishlistPanel";
import type { Database } from "@/lib/database.types";

type Tab = "profile" | "orders" | "addresses" | "wishlist";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Address = Database["public"]["Tables"]["addresses"]["Row"];
type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile & Security" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "wishlist", label: "Wishlist" },
];

export default function ProfileTabs({
  userId,
  email,
  displayName,
  avatarUrl,
  orders,
  addresses,
  favorites,
}: {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  orders: Order[];
  addresses: Address[];
  favorites: Favorite[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div>
      <h1 className="font-serif text-2xl mb-6">Your account</h1>

      <div className="flex gap-6 border-b border-[#E2E1DD] mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap pb-3 text-[11px] uppercase tracking-[0.18em] border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#141414] text-[#141414]"
                : "border-transparent text-[#141414]/45 hover:text-[#141414]/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <ProfileSecurityPanel
          userId={userId}
          email={email}
          displayName={displayName}
          avatarUrl={avatarUrl}
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
  );
}
