"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthLayout, { GoogleIcon } from "../componets/AuthLayout";
import { isValidEmail, friendlyAuthError, type AuthErrorField } from "@/lib/authValidation";

const baseInputClass =
  "w-full rounded-lg border bg-[#FAFAF8] px-4 py-3 text-[14px] text-[#141414] placeholder:text-[#141414]/30 focus:outline-none transition-colors";
const normalBorder = "border-[#E2E1DD] focus:border-[#141414]";
const errorBorder = "border-red-400 focus:border-red-500";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<AuthErrorField | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const emailFormatError =
    emailTouched && email.length > 0 && !isValidEmail(email) ? "Enter a valid email address." : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorField(null);

    if (!isValidEmail(email)) {
      setEmailTouched(true);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      const friendly = friendlyAuthError(error.message);
      setError(friendly.message);
      setErrorField(friendly.field ?? null);
      return;
    }

    router.push("/profile");
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const emailInError = Boolean(emailFormatError) || errorField === "email" || errorField === "both";
  const passwordInError = errorField === "password" || errorField === "both";

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your account.">
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
              setErrorField(null);
            }}
            onBlur={() => setEmailTouched(true)}
            placeholder="you@example.com"
            required
            className={`${baseInputClass} ${emailInError ? errorBorder : normalBorder}`}
          />
          {emailFormatError && <p className="mt-1.5 text-[12px] text-red-600">{emailFormatError}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50">
              Password
            </label>
            <Link href="/forgot-password" className="text-[11px] text-[#141414]/55 underline underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
              setErrorField(null);
            }}
            placeholder="••••••••"
            required
            minLength={6}
            className={`${baseInputClass} ${passwordInError ? errorBorder : normalBorder}`}
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
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-[#E2E1DD]" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#141414]/35">or</span>
        <div className="h-px flex-1 bg-[#E2E1DD]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#E2E1DD] bg-white py-3 text-[13px] font-medium text-[#141414] transition-colors hover:bg-[#F4F2ED]"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-[13px] text-[#141414]/55">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#141414] underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
