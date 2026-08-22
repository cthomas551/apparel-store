import StoreApp from "@/app/componets/StoreApp";
import { createClient } from "@/lib/supabase/server";
import { getActiveProducts } from "@/lib/products";

export default async function StorePage() {
  const supabase = await createClient();
  const products = await getActiveProducts(supabase);

  return <StoreApp products={products} />;
}
