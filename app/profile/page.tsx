import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/lib/products";
import ProfileTabs from "./ProfileTabs";
import DashboardLayout from "../componets/DashboardLayout";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: orders }, { data: addresses }, { data: favorites }, products] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("favorites").select("*").eq("user_id", user.id),
      getActiveProducts(supabase),
    ]);

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
    <DashboardLayout>
      <ProfileTabs
        userId={user.id}
        email={user.email ?? ""}
        displayName={displayName}
        avatarUrl={avatarUrl}
        profile={profile ?? null}
        orders={orders ?? []}
        addresses={addresses ?? []}
        favorites={favorites ?? []}
        products={products}
      />
    </DashboardLayout>
  );
}
