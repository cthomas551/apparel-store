import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Marrow",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh w-full bg-[#FAFAF8] text-[#141414]">
      <header className="border-b border-[#E2E1DD] px-6 py-6">
        <Link href="/store" className="font-serif text-[15px] tracking-[0.32em] uppercase">
          Marrow
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-[#141414]/50 mb-10">Last updated August 21, 2026</p>

        <div className="flex flex-col gap-8 text-[14px] leading-relaxed text-[#141414]/80">
          <section>
            <h2 className="text-[12px] uppercase tracking-[0.16em] text-[#141414] mb-3">
              Information We Collect
            </h2>
            <p>
              When you create an account, we collect your name, email address, and (if you choose to
              add one) a profile photo, phone number, birthday, and other account details you enter
              yourself. If you sign in with Google, we receive your name, email, and profile photo
              from Google. When you place an order, our payment processor, Stripe, collects your
              payment and shipping details directly -- we do not see or store your full card number.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] uppercase tracking-[0.16em] text-[#141414] mb-3">
              How We Use Your Information
            </h2>
            <p>
              We use your information to create and manage your account, process and fulfill orders,
              send order confirmations and receipts, and let you save addresses and wishlist items for
              future visits. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] uppercase tracking-[0.16em] text-[#141414] mb-3">
              Third-Party Services
            </h2>
            <p>
              We use Supabase to store account and order data, and Stripe to process payments. Both
              providers maintain their own privacy and security practices for the data they handle on
              our behalf. If you sign in with Google, Google&apos;s own privacy policy also applies to
              that sign-in process.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] uppercase tracking-[0.16em] text-[#141414] mb-3">
              Your Choices
            </h2>
            <p>
              You can update or delete most of your account information at any time from your{" "}
              <Link href="/profile" className="underline underline-offset-4">
                account page
              </Link>
              . To request full deletion of your account and associated data, contact us using the
              details below.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] uppercase tracking-[0.16em] text-[#141414] mb-3">
              Contact Us
            </h2>
            <p>
              Questions about this policy or your data can be sent to{" "}
              <a href="mailto:cthomas551@gmail.com" className="underline underline-offset-4">
                cthomas551@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
