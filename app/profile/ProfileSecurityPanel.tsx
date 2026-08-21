"use client";

import Link from "next/link";
import AvatarUploader from "./AvatarUploader";
import ProfileEditForm from "./ProfileEditForm";
import SignOutButton from "./SignOutButton";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ProfileSecurityPanel({
  userId,
  email,
  displayName,
  avatarUrl,
  profile,
}: {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  profile: Profile | null;
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

      <div className="border-t border-[#E2E1DD]/70 pt-8">
        <ProfileEditForm userId={userId} email={email} displayName={displayName} profile={profile} />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#E2E1DD]/70 mt-8 pt-6">
        <Link
          href="/forgot-password"
          className="text-[13px] text-[#141414] transition-colors duration-200 hover:text-[#141414]/60"
        >
          Change password
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
