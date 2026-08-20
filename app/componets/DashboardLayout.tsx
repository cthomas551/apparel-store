import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-[#FAFAF8] text-[#141414] flex flex-col items-center px-6 py-16">
      <Link href="/store" className="font-serif text-[15px] tracking-[0.32em] uppercase mb-10">
        Marrow
      </Link>

      <div className="w-full max-w-3xl bg-white border border-[#E2E1DD] rounded-2xl px-6 py-8 sm:px-10 sm:py-10 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_12px_32px_-16px_rgba(20,20,20,0.12)]">
        {children}
      </div>
    </div>
  );
}
