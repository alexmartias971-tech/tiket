"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { CATEGORY_COLORS, download, money, dateShort, timeOnly, toCsv, type Receipt } from "@/lib/format";

type Filter = "all" | "today" | "week" | "paper";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "today", label: "Aujourd’hui" },
  { id: "week", label: "7 derniers jours" },
  { id: "paper", label: "Tickets papier" },
];

export default function ReceiptsPage() {
  const [rows, setRows] = useState<Receipt[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: u } = await sb.auth.getUser();
      const { data, error } = await sb
        .from("receipts")
        .select("*")
        .eq("owner_id", u.user?.id)
        .order("purchased_at", { ascending: false })
        .limit(500);
      if (error) setError(error.message);
      setRows((data as Receipt[]) ?? []);
    })();
  }, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 864e5;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const t = new Date(r.purchased_at).getTime();
      if (filter === "today" && t < startToday) return false;
      if (filter === "week" && t < weekAgo) return false;
      if (filter === "paper" && r.source !== "upload") return false;
      if (needle && !`${r.merchant_name} ${r.category} ${r.number ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, filter]);

  const month = useMemo(() => {
    const now = new Date();
    const list = (rows ?? []).filter((r) => {
      const d = new Date(r.purchased_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return { total: list.reduce((s, r) => s + r.total_cents, 0), count: list.length };
  }, [rows]);

  if (!rows) return <Spinner />;

  // group by day
  const groups: [string, Receipt[]][] = [];
  for (const r of visible) {
    const key = new Date(r.purchased_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const g = groups.find(([k]) => k === key);
    if (g) g[1].push(r); else groups.push([key, [r]]);
  }

  return (
    <div className="pt-2">
      <section className="rounded-[22px] bg-lagoon text-white p-6 flex items-end justify-between">
        <div>
          <div className="text-white/75 text-[15px]">Ce mois-ci</div>
          <div className="mt-1 text-[38px] font-extrabold tracking-tight tabular-nums">{money(month.total)}</div>
        </div>
        <div className="text-right">
          <div className="text-white/75 text-[15px]">Tickets</div>
          <div className="mt-1 text-[28px] font-bold tabular-nums">{month.count}</div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold tracking-tight">Mes tickets</h1>
        <button className="btn btn-ghost h-10 px-4 text-[14px]" disabled={!visible.length}
          onClick={() => download(`tickets-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(visible))}>
          Exporter en CSV
        </button>
      </div>

      <input type="search" placeholder="Rechercher un commerce, une catégorie…" className="field mt-4" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
            className={`shrink-0 h-9 px-4 rounded-full text-[14px] font-medium border-[1.5px] ${filter === f.id ? "bg-lagoon text-white border-lagoon" : "bg-paper border-sand-deep text-ink-soft"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-alert">Impossible de charger vos tickets : {error}</p>}

      {rows.length === 0 ? (
        <div className="mt-10 panel p-8 text-center">
          <h2 className="text-[20px] font-semibold">Aucun ticket pour l’instant</h2>
          <p className="mt-2 text-ink-soft leading-[1.6]">
            Au moment de payer, approchez votre téléphone d’une borne tikèt : le ticket arrivera ici.
            Vous pouvez aussi photographier un ticket papier.
          </p>
          <Link href="/app/ajouter" className="btn btn-primary mt-6">Ajouter un ticket papier</Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-ink-soft">Aucun ticket ne correspond à cette recherche.</p>
      ) : (
        <div className="mt-6 space-y-7">
          {groups.map(([day, list]) => (
            <section key={day}>
              <h2 className="text-[14px] font-semibold text-mute first-letter:uppercase">{day}</h2>
              <ul className="mt-2 panel divide-y divide-sand">
                {list.map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/ticket/${r.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-sand/50 first:rounded-t-[20px] last:rounded-b-[20px]">
                      <span className="h-10 w-1.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[r.category] ?? "#a7b0ad" }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold truncate">{r.merchant_name}</span>
                        <span className="block text-[14px] text-mute">
                          {timeOnly(r.purchased_at)} · {r.category}{r.source === "upload" ? " · papier" : ""}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold tabular-nums">{money(r.total_cents)}</span>
                        <span className="block text-[13px] text-mute">{dateShort(r.purchased_at)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
