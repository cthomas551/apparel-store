import type { PasswordCheck } from "@/lib/passwordRules";

export default function PasswordChecklist({ checks }: { checks: PasswordCheck[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {checks.map((check) => (
        <li
          key={check.id}
          className={`flex items-center gap-2 text-[12px] transition-colors ${
            check.passed ? "text-emerald-600" : "text-[#141414]/40"
          }`}
        >
          <span
            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none transition-colors ${
              check.passed ? "border-emerald-600 bg-emerald-600 text-white" : "border-[#141414]/25"
            }`}
          >
            {check.passed ? "✓" : ""}
          </span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}
