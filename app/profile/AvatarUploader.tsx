"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUploader({
  userId,
  initialAvatarUrl,
}: {
  userId: string;
  initialAvatarUrl: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: path, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60);

    setAvatarUrl(signed?.signedUrl ?? null);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#E2E1DD] bg-[#F4F2ED]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <IconUserPlaceholder />
        )}
      </div>

      <label className="cursor-pointer rounded-lg border border-[#E2E1DD] bg-white px-4 py-2 text-[12px] font-medium text-[#141414] transition-colors hover:bg-[#F4F2ED]">
        {uploading ? "Uploading..." : "Change photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

function IconUserPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#141414]/25" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20 C5 15.5 8 13 12 13 C16 13 19 15.5 19 20" strokeLinecap="round" />
    </svg>
  );
}
