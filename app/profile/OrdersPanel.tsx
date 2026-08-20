"use client";

import type { Database } from "@/lib/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function OrdersPanel({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-[14px] text-[#141414]/55">
        No orders yet — items you purchase will show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-[#E2E1DD] px-4 py-3"
        >
          <div>
            <span className="block text-[13px] text-[#141414]">Order #{order.id.slice(0, 8)}</span>
            <span className="block text-[12px] text-[#141414]/50">{formatDate(order.created_at)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#141414]">{formatCurrency(order.total)}</span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLES[order.status]}`}
            >
              {order.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
