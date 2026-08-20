import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";

// Scoped to the account dashboard only, via CSS variable -- doesn't touch
// the font used anywhere else in the app.
const editorial = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-editorial",
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${editorial.variable} min-h-dvh w-full bg-[#FAFAF8] text-[#141414] flex flex-col items-center px-6 py-16`}>
      <Link href="/store" className="font-serif text-[15px] tracking-[0.32em] uppercase mb-10">
        Marrow
      </Link>

      <div className="w-full max-w-5xl bg-white border border-[#E2E1DD]/80 rounded-2xl shadow-sm px-6 py-8 sm:px-10 sm:py-10">
        {children}
      </div>
    </div>
  );
}
