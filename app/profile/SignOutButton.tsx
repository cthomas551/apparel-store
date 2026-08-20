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
      className="rounded-md border border-[#E2E1DD] bg-white px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#141414]/70 transition-colors duration-200 hover:bg-[#F4F2ED] hover:text-[#141414] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
