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
    <div className="flex flex-col items-center gap-8">
      <AvatarUploader userId={userId} initialAvatarUrl={avatarUrl} />

      <div className="flex w-full max-w-sm flex-col gap-5">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            Email
          </span>
          <span className="text-[14px] text-[#141414]">{email}</span>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            Name
          </span>
          <EditableName userId={userId} initialName={displayName} />
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
            Password
          </span>
          <Link
            href="/forgot-password"
            className="text-[13px] text-[#141414] underline underline-offset-4"
          >
            Change password
          </Link>
        </div>
      </div>

      <div className="w-full max-w-sm pt-2 border-t border-[#E2E1DD]">
        <div className="pt-6">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
