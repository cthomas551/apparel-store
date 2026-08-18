"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "../componets/AuthLayout";
import PasswordChecklist from "../componets/PasswordChecklist";
import { getPasswordChecks, isPasswordValid } from "@/lib/passwordRules";

const inputClass =
  "w-full rounded-lg border border-[#E2E1DD] bg-[#FAFAF8] px-4 py-3 text-[14px] text-[#141414] placeholder:text-[#141414]/30 focus:outline-none focus:border-[#141414] transition-colors";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setEmail(data.user?.email ?? "");
      setCheckingSession(false);
    });
  }, [supabase]);

  const passwordChecks = getPasswordChecks(password, email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password, email)) {
      setError("Please meet all password requirements below.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/profile");
  }

  if (checkingSession) {
    return (
      <AuthLayout title="Reset your password" subtitle="">
        <p className="text-[14px] text-[#141414]/55">Checking your link...</p>
      </AuthLayout>
    );
  }

  if (!hasSession) {
    return (
      <AuthLayout title="Link expired" subtitle="">
        <p className="text-[14px] text-[#141414]/70 leading-relaxed">
          This password reset link is invalid or has expired. Request a new one from the{" "}
          <a href="/forgot-password" className="text-[#141414] underline underline-offset-4">
            forgot password
          </a>{" "}
          page.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter a new password for your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
            required
            minLength={12}
            className={inputClass}
          />
          <PasswordChecklist checks={passwordChecks} />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !isPasswordValid(password, email)}
          className="w-full rounded-lg bg-[#141414] py-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[#FAFAF8] transition-colors hover:bg-[#141414]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </AuthLayout>
  );
}
