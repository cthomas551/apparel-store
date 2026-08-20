import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarUploader from "./AvatarUploader";
import EditableName from "./EditableName";
import SignOutButton from "./SignOutButton";
import AuthLayout from "../componets/AuthLayout";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";
  const displayName = profile?.full_name ?? metadataName;

  const rawAvatar =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  let avatarUrl: string | null = null;
  if (rawAvatar) {
    if (rawAvatar.startsWith("http")) {
      avatarUrl = rawAvatar;
    } else {
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(rawAvatar, 60 * 60);
      avatarUrl = signed?.signedUrl ?? null;
    }
  }

  return (
    <AuthLayout title="Your profile" subtitle="">
      <div className="flex flex-col items-center gap-8">
        <AvatarUploader userId={user.id} initialAvatarUrl={avatarUrl} />

        <div className="flex w-full flex-col gap-5">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
              Email
            </span>
            <span className="text-[14px] text-[#141414]">{user.email}</span>
          </div>

          <div>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#141414]/50 mb-1.5">
              Name
            </span>
            <EditableName userId={user.id} initialName={displayName} />
          </div>
        </div>

        <div className="w-full pt-2 border-t border-[#E2E1DD]">
          <div className="pt-6">
            <SignOutButton />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
