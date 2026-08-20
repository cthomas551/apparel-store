"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

const inputClass =
  "w-full rounded-lg border border-[#E2E1DD] bg-[#FAFAF8] px-3 py-2 text-[14px] text-[#141414] placeholder:text-[#141414]/30 focus:outline-none focus:border-[#141414] transition-colors";

type FormState = {
  id?: string;
  label: string;
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

const EMPTY_FORM: FormState = {
  label: "Home",
  full_name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  is_default: false,
};

export default function AddressesPanel({
  userId,
  initialAddresses,
}: {
  userId: string;
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function startAdd() {
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(address: Address) {
    setForm({
      id: address.id,
      label: address.label,
      full_name: address.full_name,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);

    const payload = {
      user_id: userId,
      label: form.label.trim() || "Home",
      full_name: form.full_name.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim() || "US",
      is_default: form.is_default,
    };

    if (form.id) {
      const { data, error } = await supabase
        .from("addresses")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();

      if (error || !data) {
        setError(error?.message ?? "Something went wrong.");
        setSaving(false);
        return;
      }
      setAddresses((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    } else {
      const { data, error } = await supabase.from("addresses").insert(payload).select().single();

      if (error || !data) {
        setError(error?.message ?? "Something went wrong.");
        setSaving(false);
        return;
      }
      setAddresses((prev) => [...prev, data]);
    }

    setSaving(false);
    setForm(null);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (!error) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !form && (
        <p className="text-[14px] text-[#141414]/55">No saved addresses yet.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <div key={address.id} className="rounded-lg border border-[#E2E1DD] p-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[12px] uppercase tracking-[0.14em] text-[#141414]/50">
                {address.label}
              </span>
              {address.is_default && (
                <span className="rounded-full border border-[#E2E1DD] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#141414]/60">
                  Default
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#141414]">{address.full_name}</p>
            <p className="text-[13px] text-[#141414]/70">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
            </p>
            <p className="text-[13px] text-[#141414]/70">
              {address.city}, {address.state} {address.postal_code}
            </p>
            <div className="flex gap-4 mt-3">
              <button
                type="button"
                onClick={() => startEdit(address)}
                className="text-[12px] text-[#141414]/60 underline underline-offset-4"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="text-[12px] text-red-600 underline underline-offset-4"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {form ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3 rounded-lg border border-[#E2E1DD] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Label (e.g. Home)"
              className={inputClass}
            />
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Full name"
              required
              className={inputClass}
            />
          </div>
          <input
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            placeholder="Address line 1"
            required
            className={inputClass}
          />
          <input
            value={form.line2}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
            placeholder="Address line 2 (optional)"
            className={inputClass}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              required
              className={inputClass}
            />
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
              required
              className={inputClass}
            />
            <input
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              placeholder="Postal code"
              required
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-[13px] text-[#141414]/70">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
            Set as default address
          </label>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#141414] px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-[#FAFAF8] transition-colors hover:bg-[#141414]/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-lg border border-[#E2E1DD] px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-[#141414] transition-colors hover:bg-[#F4F2ED]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="self-start rounded-lg border border-[#E2E1DD] px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-[#141414] transition-colors hover:bg-[#F4F2ED]"
        >
          + Add new address
        </button>
      )}
    </div>
  );
}
