"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignOut() {
    setLoading(true);
    // Redirect happens in AuthListener, which reacts to the SIGNED_OUT event
    // this triggers -- so it works no matter where sign-out is initiated from.
    await supabase.auth.signOut();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="w-full rounded-lg border border-red-200 bg-white py-3 text-[12px] font-medium uppercase tracking-[0.18em] text-red-600 transition-colors hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
