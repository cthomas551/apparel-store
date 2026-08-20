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
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ full_name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", userId);

    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-[#141414]">{name}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] text-[#141414]/55 underline underline-offset-4 shrink-0"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="flex-1 rounded-lg border border-[#E2E1DD] bg-[#FAFAF8] px-3 py-2 text-[14px] text-[#141414] focus:outline-none focus:border-[#141414] transition-colors"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="shrink-0 rounded-lg bg-[#141414] px-3 py-2 text-[12px] uppercase tracking-wide text-[#FAFAF8] transition-colors hover:bg-[#141414]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "..." : "Save"}
      </button>
    </div>
  );
}
