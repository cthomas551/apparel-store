"use client";

import Link from "next/link";
import AvatarUploader from "./AvatarUploader";
import EditableName from "./EditableName";
import SignOutButton from "./SignOutButton";

export default function ProfileSecurityPanel({
  userId,
  email,
  displayName,
  avatarUrl,
}: {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-6 pb-8">
        <AvatarUploader userId={userId} initialAvatarUrl={avatarUrl} />
        <div>
          <p className="font-[family-name:var(--font-editorial)] text-2xl font-semibold">
            {displayName || "Welcome"}
          </p>
          <p className="text-[13px] text-[#141414]/55">{email}</p>
        </div>
      </div>

      <div className="divide-y divide-[#E2E1DD]/70 border-t border-[#E2E1DD]/70">
        <div className="grid gap-1 py-5 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-6">
          <span className="text-[11px] uppercase tracking-[0.16em] text-[#141414]/45">Email</span>
          <span className="text-[14px] font-medium text-[#141414]">{email}</span>
        </div>

        <div className="grid gap-1 py-5 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-6">
          <span className="text-[11px] uppercase tracking-[0.16em] text-[#141414]/45">Name</span>
          <div className="max-w-sm">
            <EditableName userId={userId} initialName={displayName} />
          </div>
        </div>

        <div className="grid gap-1 py-5 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-6">
          <span className="text-[11px] uppercase tracking-[0.16em] text-[#141414]/45">Password</span>
          <Link
            href="/forgot-password"
            className="w-fit text-[13px] text-[#141414] transition-colors duration-200 hover:text-[#141414]/60"
          >
            Change password
          </Link>
        </div>
      </div>

      <div className="pt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
