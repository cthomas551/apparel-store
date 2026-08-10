import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import type { CartItem } from "@/app/componets/CartModal";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}
const stripe = new Stripe(stripeSecretKey);

function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== "object" || item === null) return false;
  const { name, size, price, imageUrl, quantity } = item as Record<string, unknown>;
  return (
    typeof name === "string" &&
    name.length > 0 &&
    typeof size === "string" &&
    typeof price === "number" &&
    price > 0 &&
    typeof imageUrl === "string" &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0 || !items.every(isValidCartItem)) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: `${item.name} (${item.size})`,
            images: [item.imageUrl],
          },
        },
      })),
      success_url: `${origin}/store?checkout=success`,
      cancel_url: `${origin}/store?checkout=cancelled`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
