"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditableName({
  userId,
  initialName,
}: {
  userId: string;
  initialName: string;
}) {
  const [editing, setEditing] = useState(!initialName);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    setSaving(false);

    // .update() without .select() silently "succeeds" even if RLS or a
    // missing row meant zero rows were actually changed.
    if (error || !data) {
      setError(error?.message ?? "Couldn't save your name -- please try again.");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-medium text-[#141414]">{name}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] uppercase tracking-[0.14em] text-[#141414]/50 shrink-0 transition-colors duration-200 hover:text-[#141414]"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className="flex-1 border-0 border-b border-[#E2E1DD] bg-transparent px-0 py-1.5 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] transition-colors duration-200"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-[#141414]/50 pb-1.5 transition-colors duration-200 hover:text-[#141414] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
