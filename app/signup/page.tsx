"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthLayout, { GoogleIcon } from "../componets/AuthLayout";

const inputClass =
  "w-full rounded-lg border border-[#E2E1DD] bg-[#FAFAF8] px-4 py-3 text-[14px] text-[#141414] placeholder:text-[#141414]/30 focus:outline-none focus:border-[#141414] transition-colors";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is enabled in Supabase, there's no session yet.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/profile");
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (checkEmail) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <p className="text-[14px] text-[#141414]/70 leading-relaxed">
          We&apos;ve sent a confirmation link to <span className="text-[#141414]">{email}</span>.
          Click it to activate your account, then come back and log in.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create an account" subtitle="Sign up to start shopping with Marrow.">
      <form onSubmit={handleSignup} className="flex flex-col gap-5">
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

        <div>
          <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
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
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-[#E2E1DD]" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#141414]/35">or</span>
        <div className="h-px flex-1 bg-[#E2E1DD]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#E2E1DD] bg-white py-3 text-[13px] font-medium text-[#141414] transition-colors hover:bg-[#F4F2ED]"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-[13px] text-[#141414]/55">
        Already have an account?{" "}
        <Link href="/login" className="text-[#141414] underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
