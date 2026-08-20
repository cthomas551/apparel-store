import Link from "next/link";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}
const stripe = new Stripe(stripeSecretKey);

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amountInCents / 100
  );
}

function estimatedDeliveryRange() {
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const start = new Date();
  start.setDate(start.getDate() + 5);
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return `${fmt(start)} – ${fmt(end)}`;
}

function NotFoundMessage() {
  return (
    <p className="text-[14px] text-[#141414]/70 leading-relaxed">
      We couldn&apos;t find that order. If you just completed a purchase, check your email for a
      receipt, or view your{" "}
      <Link href="/profile" className="text-[#141414] underline underline-offset-4">
        order history
      </Link>
      .
    </p>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <ConfirmationShell>
        <NotFoundMessage />
      </ConfirmationShell>
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
  } catch {
    return (
      <ConfirmationShell>
        <NotFoundMessage />
      </ConfirmationShell>
    );
  }

  if (session.payment_status !== "paid") {
    return (
      <ConfirmationShell>
        <p className="text-[14px] text-[#141414]/70 leading-relaxed">
          This order hasn&apos;t been paid yet. If you think this is a mistake, please contact us.
        </p>
      </ConfirmationShell>
    );
  }

  const items = session.line_items?.data ?? [];
  const confirmationNumber = session.id.replace(/^cs_(test|live)_/, "").slice(0, 8).toUpperCase();

  return (
    <ConfirmationShell>
      <div className="flex flex-col items-center text-center mb-8">
        <IconCheck className="h-12 w-12 text-emerald-600 mb-4" />
        <h1 className="font-serif text-3xl leading-snug mb-2">Thank you for your order</h1>
        <p className="text-[14px] text-[#141414]/60">
          A confirmation has been sent to {session.customer_details?.email ?? "your email"}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-[#E2E1DD] py-5 mb-6">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.16em] text-[#141414]/45 mb-1">
            Confirmation #
          </span>
          <span className="text-[14px] text-[#141414]">{confirmationNumber}</span>
        </div>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.16em] text-[#141414]/45 mb-1">
            Estimated Delivery
          </span>
          <span className="text-[14px] text-[#141414]">{estimatedDeliveryRange()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] text-[#141414]">{item.description}</p>
              <p className="text-[12px] text-[#141414]/50">Qty {item.quantity}</p>
            </div>
            <span className="text-[14px] text-[#141414]">
              {formatCurrency(item.amount_total ?? 0)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#E2E1DD] pt-4 mb-8">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[#141414]/50">Total Paid</span>
        <span className="text-[16px] font-medium text-[#141414]">
          {formatCurrency(session.amount_total ?? 0)}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/profile"
          className="w-full rounded-lg bg-[#141414] py-3 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-[#FAFAF8] transition-colors hover:bg-[#141414]/90"
        >
          View in Order History
        </Link>
        <Link
          href="/store"
          className="w-full rounded-lg border border-[#E2E1DD] py-3 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-[#141414] transition-colors hover:bg-[#F4F2ED]"
        >
          Continue Shopping
        </Link>
      </div>
    </ConfirmationShell>
  );
}

function ConfirmationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-[#FAFAF8] text-[#141414] flex flex-col items-center justify-center px-6 py-16">
      <Link href="/store" className="font-serif text-[15px] tracking-[0.32em] uppercase mb-10">
        Marrow
      </Link>
      <div className="w-full max-w-md bg-white border border-[#E2E1DD] rounded-2xl px-8 py-10 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-16px_rgba(20,20,20,0.12)]">
        {children}
      </div>
    </div>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.5 L10.8 15.3 L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
