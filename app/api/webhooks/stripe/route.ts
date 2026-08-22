import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}
const stripe = new Stripe(stripeSecretKey);

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    // Sessions created before login-required checkout have no user to
    // attribute the order to -- skip recording rather than erroring.
    if (userId) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ["data.price.product"],
      });

      const items = lineItems.data
        .map((li) => {
          const product = li.price?.product;
          const variantId =
            product && typeof product === "object" && !("deleted" in product && product.deleted)
              ? (product as Stripe.Product).metadata?.variantId
              : undefined;

          if (!variantId || !li.price) return null;

          return {
            variant_id: variantId,
            quantity: li.quantity ?? 1,
            unit_price: li.price.unit_amount != null ? li.price.unit_amount / 100 : 0,
          };
        })
        .filter((item): item is { variant_id: string; quantity: number; unit_price: number } => item !== null);

      if (items.length === 0) {
        console.error("Checkout session had no recognizable variant line items:", session.id);
        return NextResponse.json({ error: "No items to record." }, { status: 500 });
      }

      const admin = createAdminClient();
      const { error } = await admin.rpc("record_paid_order", {
        p_user_id: userId,
        p_stripe_session_id: session.id,
        p_items: items,
      });

      if (error) {
        console.error("Failed to record order:", error);
        return NextResponse.json({ error: "Failed to record order." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
