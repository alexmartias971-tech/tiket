"use client";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { CATEGORY_COLORS, money, type Receipt } from "@/lib/format";

export default function StatsPage() {
  const [rows, setRows] = useState<Receipt[] | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: u } = await sb.auth.getUser();
      const since = new Date(); since.setMonth(since.getMonth() - 6); since.setDate(1);
      const { data } = await sb.from("receipts").select("total_cents,category,purchased_at,merchant_name")
        .eq("owner_id", u.user?.id).gte("purchased_at", since.toISOString());
      setRows((data as Receipt[]) ?? []);
    })();
  }, []);

  const s = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("fr-FR", { month: "short" }), total: 0, count: 0 };
    });
    const cats: Record<string, number> = {};
    const shops: Record<string, number> = {};
    for (const r of rows ?? []) {
      const d = new Date(r.purchased_at);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) { m.total += r.total_cents; m.count++; }
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        cats[r.category] = (cats[r.category] ?? 0) + r.total_cents;
        shops[r.merchant_name] = (shops[r.merchant_name] ?? 0) + r.total_cents;
      }
    }
    const cur = months[5], prev = months[4];
    const delta = prev.total ? Math.round(((cur.total - prev.total) / prev.total) * 100) : null;
    const max = Math.max(1, ...months.map((m) => m.total));
    const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const shopList = Object.entries(shops).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { months, cur, delta, max, catList, shopList, catTotal: catList.reduce((a, [, v]) => a + v, 0) };
  }, [rows]);

  if (!rows) return <Spinner />;

  return (
    <div className="pt-2 space-y-5">
      <h1 className="text-[24px] font-bold tracking-tight">Mes dépenses</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="panel p-5">
          <div className="text-[14px] text-mute">Ce mois-ci</div>
          <div className="mt-1 text-[26px] font-bold tabular-nums">{money(s.cur.total)}</div>
          <div className={`text-[13.5px] ${s.delta !== null && s.delta > 0 ? "text-alert" : "text-lagoon"}`}>
            {s.delta === null ? "Pas de mois précédent" : `${s.delta > 0 ? "+" : ""}${s.delta} % vs mois dernier`}
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-[14px] text-mute">Tickets ce mois</div>
          <div className="mt-1 text-[26px] font-bold tabular-nums">{s.cur.count}</div>
          <div className="text-[13.5px] text-mute">
            Panier moyen {s.cur.count ? money(Math.round(s.cur.total / s.cur.count)) : "—"}
          </div>
        </div>
      </div>

      <section className="panel p-5">
        <h2 className="font-semibold text-[17px]">Par mois</h2>
        <ul className="mt-4 space-y-3">
          {s.months.map((m, i) => (
            <li key={m.key} className="grid grid-cols-[44px_1fr_84px] items-center gap-3 text-[14.5px]">
              <span className="text-ink-soft first-letter:uppercase">{m.label.replace(".", "")}</span>
              <span className="h-3 rounded-full bg-sand overflow-hidden">
                <span className={`block h-full rounded-full ${i === 5 ? "bg-lagoon" : "bg-lagoon/35"}`} style={{ width: `${(m.total / s.max) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{money(m.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold text-[17px]">Par catégorie, ce mois-ci</h2>
        {s.catList.length === 0 ? (
          <p className="mt-3 text-ink-soft">Aucune dépense ce mois-ci.</p>
        ) : (
          <>
            <div className="mt-4 flex h-4 rounded-full overflow-hidden gap-[2px]" aria-hidden>
              {s.catList.map(([c, v]) => (
                <span key={c} style={{ width: `${(v / s.catTotal) * 100}%`, background: CATEGORY_COLORS[c] ?? "#a7b0ad" }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {s.catList.map(([c, v]) => (
                <li key={c} className="flex items-center gap-3 text-[15px]">
                  <span className="h-3 w-3 rounded-sm" style={{ background: CATEGORY_COLORS[c] ?? "#a7b0ad" }} />
                  <span className="flex-1">{c}</span>
                  <span className="text-mute tabular-nums">{Math.round((v / s.catTotal) * 100)} %</span>
                  <span className="w-24 text-right tabular-nums font-medium">{money(v)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {s.shopList.length > 0 && (
        <section className="panel p-5">
          <h2 className="font-semibold text-[17px]">Commerces où vous dépensez le plus</h2>
          <ul className="mt-3 divide-y divide-sand">
            {s.shopList.map(([n, v]) => (
              <li key={n} className="flex justify-between py-2.5 text-[15px]">
                <span className="truncate pr-3">{n}</span>
                <span className="tabular-nums font-medium">{money(v)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
