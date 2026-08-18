"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "../componets/AuthLayout";

const inputClass =
  "w-full rounded-lg border border-[#E2E1DD] bg-[#FAFAF8] px-4 py-3 text-[14px] text-[#141414] placeholder:text-[#141414]/30 focus:outline-none focus:border-[#141414] transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <p className="text-[14px] text-[#141414]/70 leading-relaxed">
          If an account exists for <span className="text-[#141414]">{email}</span>, we&apos;ve sent
          a link to reset your password.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={inputClass}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#141414] py-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[#FAFAF8] transition-colors hover:bg-[#141414]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-[#141414]/55">
        Remembered it?{" "}
        <Link href="/login" className="text-[#141414] underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
