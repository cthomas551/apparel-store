"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];

function splitName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default function ProfileEditForm({
  userId,
  email,
  displayName,
  profile,
}: {
  userId: string;
  email: string;
  displayName: string;
  profile: Profile | null;
}) {
  const { first, last } = splitName(displayName);
  const [title, setTitle] = useState(profile?.title ?? "");
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [company, setCompany] = useState(profile?.company ?? "");
  const [emailValue, setEmailValue] = useState(email);
  const [birthdayMonth, setBirthdayMonth] = useState(profile?.birthday_month?.toString() ?? "");
  const [birthdayDay, setBirthdayDay] = useState(profile?.birthday_day?.toString() ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [mobilePhone, setMobilePhone] = useState(profile?.mobile_phone ?? "");
  const [interests, setInterests] = useState(profile?.interests ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setEmailConfirmationSent(false);

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

    const { data, error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        title: title.trim() || null,
        company: company.trim() || null,
        birthday_month: birthdayMonth ? Number(birthdayMonth) : null,
        birthday_day: birthdayDay ? Number(birthdayDay) : null,
        gender: gender || null,
        phone: phone.trim() || null,
        mobile_phone: mobilePhone.trim() || null,
        interests: interests.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (profileError || !data) {
      setError(profileError?.message ?? "Couldn't save your changes -- please try again.");
      setSaving(false);
      return;
    }

    // Changing the login email is a separate, security-sensitive operation --
    // Supabase sends a confirmation link and the change doesn't take effect
    // until it's clicked, so this can't just be another column on profiles.
    if (emailValue.trim() && emailValue.trim() !== email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: emailValue.trim() });
      if (emailError) {
        setError(emailError.message);
        setSaving(false);
        return;
      }
      setEmailConfirmationSent(true);
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-[#141414]/50">
        Change Name / Email
      </h3>

      <TextField label="Title" value={title} onChange={setTitle} />
      <TextField label="First Name" required value={firstName} onChange={setFirstName} />
      <TextField label="Last Name" required value={lastName} onChange={setLastName} />
      <TextField label="Company Name, C/O" value={company} onChange={setCompany} />
      <TextField
        label="Email Address"
        required
        type="email"
        value={emailValue}
        onChange={setEmailValue}
      />

      {emailConfirmationSent && (
        <p className="-mt-1 text-[12px] text-[#141414]/60">
          Check {emailValue} to confirm your new email address — it won&apos;t take effect until then.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Birthday Month"
          value={birthdayMonth}
          onChange={setBirthdayMonth}
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
        />
        <SelectField
          label="Birthday Day"
          value={birthdayDay}
          onChange={setBirthdayDay}
          options={Array.from({ length: 31 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />
      </div>

      <div>
        <SelectField
          label="Gender (Optional)"
          value={gender}
          onChange={setGender}
          options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))}
        />
        <p className="mt-2 text-[12px] leading-relaxed text-[#141414]/45">
          Providing your gender is fully optional. This information helps us curate a more specific
          experience.
        </p>
      </div>

      <PhoneField label="Phone Number" value={phone} onChange={setPhone} />
      <PhoneField label="Mobile Number" value={mobilePhone} onChange={setMobilePhone} />

      <TextAreaField label="I'm interested in..." value={interests} onChange={setInterests} />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-[#141414] px-6 py-2.5 text-[12px] uppercase tracking-[0.16em] text-[#FAFAF8] transition-colors duration-200 hover:bg-[#141414]/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E2E1DD] px-4 pt-2.5 pb-2 transition-colors duration-200 focus-within:border-[#141414]">
      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#141414]/45">
        {required && <span className="text-[#141414]/60">* </span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-transparent pt-0.5 text-[14px] text-[#141414] focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative rounded-lg border border-[#E2E1DD] px-4 pt-2.5 pb-2 transition-colors duration-200 focus-within:border-[#141414]">
      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#141414]/45">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent pt-0.5 pr-6 text-[14px] text-[#141414] focus:outline-none"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#141414]/40" />
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="relative rounded-lg border border-[#E2E1DD] px-4 pt-2.5 pb-2 pr-10 transition-colors duration-200 focus-within:border-[#141414]">
        <label className="block text-[10px] uppercase tracking-[0.14em] text-[#141414]/45">
          {label}
        </label>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent pt-0.5 text-[14px] text-[#141414] focus:outline-none"
        />
        <span
          title="Used for order and delivery updates only."
          className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-help items-center justify-center rounded-full bg-[#141414]/50 text-[10px] text-white"
        >
          i
        </span>
      </div>
      <p className="mt-1.5 text-right text-[11px] text-[#141414]/40">Format: 333-333-3333</p>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E2E1DD] px-4 pt-2.5 pb-2 transition-colors duration-200 focus-within:border-[#141414]">
      <label className="block text-[10px] uppercase tracking-[0.14em] text-[#141414]/45">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full resize-y bg-transparent pt-0.5 text-[14px] text-[#141414] focus:outline-none"
      />
    </div>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M6 9 L12 15 L18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
