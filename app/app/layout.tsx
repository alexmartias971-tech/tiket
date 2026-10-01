"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { useSession } from "@/lib/useSession";

const tabs = [
  { href: "/app", label: "Tickets", icon: "M7 3h10v18l-2.5-1.8L12 21l-2.5-1.8L7 21zM10 8h4M10 12h4" },
  { href: "/app/ajouter", label: "Ajouter", icon: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" },
  { href: "/app/stats", label: "Dépenses", icon: "M5 20V10M10 20V4M15 20v-7M20 20v-4" },
  { href: "/app/compte", label: "Compte", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace(`/connexion?mode=login&next=${encodeURIComponent(path)}`);
  }, [loading, session, router, path]);

  if (loading || !session) return <Spinner />;

  return (
    <div className="min-h-dvh pb-28">
      <header className="no-print mx-auto max-w-2xl px-4 h-16 flex items-center justify-between">
        <Logo href="/app" />
      </header>
      <main className="mx-auto max-w-2xl px-4">{children}</main>
      <nav className="no-print fixed bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)] bg-paper/95 backdrop-blur border-t border-sand-deep">
        <ul className="mx-auto max-w-2xl grid grid-cols-4">
          {tabs.map((t) => {
            const active = t.href === "/app" ? path === "/app" || path.startsWith("/app/ticket") : path.startsWith(t.href);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-3 text-[12.5px] font-medium ${active ? "text-lagoon" : "text-mute"}`}>
                  <span className={`grid place-items-center h-8 w-14 rounded-full ${active ? "bg-lagoon-soft" : ""}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
