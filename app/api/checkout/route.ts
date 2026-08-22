import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}
const stripe = new Stripe(stripeSecretKey);

type CartItemRequest = { variantId: string; quantity: number };

function isValidCartItemRequest(item: unknown): item is CartItemRequest {
  if (typeof item !== "object" || item === null) return false;
  const { variantId, quantity } = item as Record<string, unknown>;
  return (
    typeof variantId === "string" &&
    variantId.length > 0 &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= 20
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in to check out.", requiresLogin: true }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0 || !items.every(isValidCartItemRequest)) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  const promoCodeRaw = (body as { promoCode?: unknown })?.promoCode;
  const promoCode = typeof promoCodeRaw === "string" && promoCodeRaw.trim().length > 0 ? promoCodeRaw.trim() : null;

  const origin = request.nextUrl.origin;

  // Price, name, and image always come from our own catalog, never from the
  // client -- otherwise a tampered request could check out any item at any
  // price it wants. Everything below is looked up server-side from just the
  // variant id the client sent.
  const variantIds = [...new Set(items.map((item) => item.variantId))];

  const { data: variants } = await supabase.from("product_variants").select("*").in("id", variantIds);
  if (!variants || variants.length !== variantIds.length) {
    return NextResponse.json(
      { error: "One of the items in your bag is no longer available." },
      { status: 400 }
    );
  }

  const productIds = [...new Set(variants.map((v) => v.product_id))];
  const [{ data: products }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").in("id", productIds).eq("status", "active"),
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
  ]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const coverImageByProductId = new Map<string, string>();
  for (const img of images ?? []) {
    if (!coverImageByProductId.has(img.product_id)) coverImageByProductId.set(img.product_id, img.url);
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const item of items) {
    const variant = variantById.get(item.variantId);
    const product = variant ? productById.get(variant.product_id) : undefined;

    if (!variant || !product) {
      return NextResponse.json(
        { error: "One of the items in your bag is no longer available." },
        { status: 400 }
      );
    }

    if (item.quantity > variant.stock_quantity) {
      return NextResponse.json(
        { error: `Only ${variant.stock_quantity} left of ${product.name} (${variant.size}).` },
        { status: 400 }
      );
    }

    const unitAmount = Math.round(Number(variant.price_override ?? product.base_price) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Unable to price one of the items in your bag." },
        { status: 400 }
      );
    }

    const imageUrl =
      coverImageByProductId.get(product.id) ?? `https://picsum.photos/seed/marrow-${product.id}/900/1125`;

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: `${product.name} (${variant.size})`,
          images: [imageUrl.startsWith("http") ? imageUrl : `${origin}${imageUrl}`],
          // Read back by the webhook to record order_items and decrement
          // stock for the exact variant that was actually paid for.
          metadata: { variantId: variant.id },
        },
      },
    });
  }

  // Promo code is optional and never trusted for its discount amount from
  // the client -- looked up fresh and checked here, same as pricing above.
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  let promotionId: string | null = null;

  if (promoCode) {
    const { data: promo } = await supabase.from("promotions").select("*").eq("code", promoCode).single();

    const now = new Date();
    const isValid =
      !!promo &&
      promo.active &&
      (!promo.starts_at || new Date(promo.starts_at) <= now) &&
      (!promo.ends_at || new Date(promo.ends_at) >= now) &&
      (promo.max_uses == null || promo.times_used < promo.max_uses);

    if (!promo || !isValid) {
      return NextResponse.json({ error: "That promo code isn't valid." }, { status: 400 });
    }

    promotionId = promo.id;

    const coupon = await stripe.coupons.create(
      promo.discount_type === "percentage"
        ? { percent_off: Number(promo.discount_value), duration: "once" }
        : { amount_off: Math.round(Number(promo.discount_value) * 100), currency: "usd", duration: "once" }
    );

    discounts = [{ coupon: coupon.id }];
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: lineItems,
      discounts,
      metadata: promotionId ? { promotionId } : undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store?checkout=cancelled`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
