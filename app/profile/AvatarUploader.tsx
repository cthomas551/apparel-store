"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BUCKET_MARKER = "/storage/v1/object/public/avatars/";

function extractStoragePath(url: string): string | null {
  const idx = url.indexOf(BUCKET_MARKER);
  if (idx === -1) return null;
  return url.slice(idx + BUCKET_MARKER.length);
}

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
  const [lastSeenInitial, setLastSeenInitial] = useState(initialAvatarUrl);
  const router = useRouter();
  const supabase = createClient();

  // Re-sync if the server sends a fresh value on re-render (e.g. after
  // router.refresh(), or if this component remounts from a tab switch).
  if (initialAvatarUrl !== lastSeenInitial) {
    setLastSeenInitial(initialAvatarUrl);
    setAvatarUrl(initialAvatarUrl);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const previousUrl = avatarUrl;
    const ext = file.name.split(".").pop();
    // Timestamped path so the URL changes on every upload -- a stable path
    // would let browsers keep showing a cached copy of the old photo.
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    // .update() without .select() silently "succeeds" even if RLS or a
    // missing row meant zero rows were actually changed -- .select().single()
    // forces a real error here instead of a false positive.
    if (updateError || !updateData) {
      setError(updateError?.message ?? "The photo uploaded, but saving it to your profile failed.");
      setUploading(false);
      return;
    }

    // Best-effort cleanup of the previous upload so storage doesn't grow
    // unbounded. Skips external URLs (e.g. a Google profile photo).
    const previousPath = previousUrl ? extractStoragePath(previousUrl) : null;
    if (previousPath) {
      await supabase.storage.from("avatars").remove([previousPath]);
    }

    setAvatarUrl(publicUrl);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#E2E1DD] bg-[#F4F2ED]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <IconUserPlaceholder />
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#141414]/25 border-t-[#141414]" />
          </div>
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
