import Link from "next/link";

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0f5c5a" />
      <path d="M10 7h12v16l-2-1.6-2 1.6-2-1.6-2 1.6-2-1.6-2 1.6z" fill="#fff" />
      <path d="M13 12h6M13 15.5h6M13 19h3.5" stroke="#0f5c5a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24.5" cy="24.5" r="3.2" fill="#f4a51c" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold text-[22px] tracking-tight text-ink">
      <Mark />
      <span>tikèt</span>
    </Link>
  );
}
