"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { CATEGORIES, money, dateTime, siteUrl, type Item, type Receipt } from "@/lib/format";

type Merchant = {
  id: string; name: string; address: string | null; siret: string | null; category: string;
  google_review_url: string | null; receipt_footer: string | null; api_key: string;
};
type Terminal = { id: string; code: string; label: string; created_at: string };
type Tab = "caisse" | "bornes" | "tickets" | "api" | "reglages";

const TABS: { id: Tab; label: string }[] = [
  { id: "caisse", label: "Encaisser" },
  { id: "bornes", label: "Bornes" },
  { id: "tickets", label: "Tickets émis" },
  { id: "api", label: "Logiciel de caisse" },
  { id: "reglages", label: "Réglages" },
];

export default function ProPage() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null | undefined>(undefined);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [tab, setTab] = useState<Tab>("caisse");

  const load = useCallback(async () => {
    const sb = supabase();
    const { data: m } = await sb.from("merchants").select("*").maybeSingle();
    setMerchant((m as Merchant) ?? null);
    if (m) {
      const { data: t } = await sb.from("terminals").select("*").eq("merchant_id", m.id).order("created_at");
      setTerminals((t as Terminal[]) ?? []);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace("/connexion?role=pro&next=/pro"); return; }
    load();
    const h = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, [loading, session, router, load]);

  if (loading || !session || merchant === undefined) return <Spinner />;

  return (
    <div className="min-h-dvh pb-16">
      <header className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo href="/pro" />
          <span className="text-[13px] font-semibold text-lagoon bg-lagoon-soft rounded-full px-2.5 py-1">Pro</span>
        </div>
        <Link href="/app" className="text-[15px] text-ink-soft hover:text-ink">Mes tickets perso</Link>
      </header>

      {merchant === null ? (
        <Onboarding onDone={load} />
      ) : (
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="text-[28px] font-bold tracking-tight">{merchant.name}</h1>
          <nav className="mt-4 flex gap-1 overflow-x-auto -mx-4 px-4 border-b border-sand-deep" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); history.replaceState(null, "", `#${t.id}`); }}
                aria-current={tab === t.id ? "page" : undefined}
                className={`shrink-0 px-4 h-11 text-[15px] font-medium border-b-[2.5px] -mb-px ${tab === t.id ? "border-lagoon text-ink" : "border-transparent text-mute hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-6">
            {tab === "caisse" && <Caisse merchant={merchant} terminals={terminals} goBornes={() => setTab("bornes")} />}
            {tab === "bornes" && <Bornes merchant={merchant} terminals={terminals} reload={load} />}
            {tab === "tickets" && <Tickets merchant={merchant} />}
            {tab === "api" && <Api merchant={merchant} terminals={terminals} />}
            {tab === "reglages" && <Reglages merchant={merchant} reload={load} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Onboarding ---------- */
function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Alimentation");
  const [address, setAddress] = useState("");
  const [siret, setSiret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const sb = supabase();
    const { data: m, error } = await sb.from("merchants")
      .insert({ name: name.trim(), category, address: address.trim() || null, siret: siret.trim() || null })
      .select("id").single();
    if (error) { setError(error.message); setBusy(false); return; }
    await sb.from("terminals").insert({ merchant_id: m.id, label: "Caisse 1" });
    onDone();
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-[30px] font-bold tracking-tight leading-tight">Présentez votre commerce</h1>
      <p className="mt-2 text-ink-soft">Ces informations apparaissent en tête de chaque ticket.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="n">Nom du commerce</label>
          <input id="n" required className="field" placeholder="Ex. Ti Kaz Bokit" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="c">Activité</label>
          <select id="c" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="a">Adresse</label>
          <textarea id="a" rows={2} className="field" placeholder={"Rue Frébault\n97110 Pointe-à-Pitre"} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="s">SIRET (facultatif)</label>
          <input id="s" inputMode="numeric" className="field" value={siret} onChange={(e) => setSiret(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Création…" : "Créer mon commerce et ma première borne"}</button>
      </form>
    </div>
  );
}

/* ---------- Encaisser ---------- */
const VAT_RATES = [
  { v: 0.085, l: "8,5 % · DOM" },
  { v: 0.021, l: "2,1 % · DOM réduit" },
  { v: 0.2, l: "20 %" },
  { v: 0.1, l: "10 %" },
  { v: 0.055, l: "5,5 %" },
  { v: 0, l: "0 % · franchise" },
];
type Line = { label: string; qty: string; price: string };
const toCents = (s: string) => Math.round(parseFloat((s || "0").replace(",", ".")) * 100) || 0;

function Caisse({ merchant, terminals, goBornes }: { merchant: Merchant; terminals: Terminal[]; goBornes: () => void }) {
  const [terminalId, setTerminalId] = useState(terminals[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([{ label: "", qty: "1", price: "" }]);
  const [vat, setVat] = useState(0.085);
  const [pay, setPay] = useState("CB");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ id: string; token: string; number: string; total: number } | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => { if (!terminalId && terminals[0]) setTerminalId(terminals[0].id); }, [terminals, terminalId]);

  const items: Item[] = lines
    .filter((l) => toCents(l.price) > 0)
    .map((l) => ({ label: l.label.trim() || "Article", qty: Math.max(1, parseInt(l.qty) || 1), unit_cents: toCents(l.price) }));
  const total = items.reduce((s, i) => s + i.qty * i.unit_cents, 0);
  const vatCents = vat ? Math.round(total - total / (1 + vat)) : 0;

  useEffect(() => {
    if (!sent || status === "claimed") return;
    const t = setInterval(async () => {
      const { data } = await supabase().from("receipts").select("status").eq("id", sent.id).single();
      if (data) setStatus(data.status);
    }, 2000);
    return () => clearInterval(t);
  }, [sent, status]);

  async function send() {
    if (!total) { setError("Ajoutez au moins un article avec un prix."); return; }
    setBusy(true); setError(null);
    const { data, error } = await supabase().from("receipts").insert({
      merchant_id: merchant.id, terminal_id: terminalId, merchant_name: merchant.name, category: merchant.category,
      total_cents: total, vat_cents: vatCents, items, payment_method: pay, status: "pending", source: "pos",
    }).select("id,access_token,number").single();
    setBusy(false);
    if (error) { setError(error.message); return; }
    const url = `${siteUrl()}/r/${data.id}?k=${data.access_token}`;
    setQr(await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#1c2422", light: "#ffffff" } }));
    setStatus("pending");
    setSent({ id: data.id, token: data.access_token, number: data.number, total });
  }

  function reset() {
    setSent(null); setQr(null); setStatus("pending");
    setLines([{ label: "", qty: "1", price: "" }]);
  }

  if (!terminals.length) return (
    <div className="panel p-6">
      <p>Créez d’abord une borne pour envoyer des tickets.</p>
      <button className="btn btn-primary mt-4" onClick={goBornes}>Créer une borne</button>
    </div>
  );

  if (sent) return (
    <div className="panel p-6 sm:p-8 max-w-xl">
      {status === "claimed" ? (
        <>
          <div className="text-lagoon font-semibold">Ticket récupéré par le client</div>
          <div className="mt-1 text-[34px] font-extrabold tabular-nums">{money(sent.total)}</div>
          <p className="mt-1 text-ink-soft">N° {sent.number}</p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="relative grid place-items-center h-10 w-10 rounded-full bg-lagoon-soft nfc-pulse" />
            <div className="font-semibold">En attente : le client approche son téléphone de la borne</div>
          </div>
          <div className="mt-4 text-[34px] font-extrabold tabular-nums">{money(sent.total)}</div>
          <p className="mt-1 text-ink-soft">Le ticket reste disponible sur la borne pendant 5 minutes. Sans NFC, le client peut scanner ce QR code :</p>
          {qr && <img src={qr} alt="QR code du ticket" width={200} height={200} className="mt-4 rounded-lg border border-sand-deep" />}
        </>
      )}
      <button className="btn btn-primary mt-6" onClick={reset}>Nouveau ticket</button>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
      <div className="panel p-5 sm:p-6">
        <h2 className="font-semibold text-[18px]">Articles</h2>
        <div className="mt-4 space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_64px_96px_36px] gap-2 items-center">
              <input aria-label="Désignation" className="field" placeholder="Désignation" value={l.label}
                onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <input aria-label="Quantité" inputMode="numeric" className="field text-center" value={l.qty}
                onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} />
              <input aria-label="Prix unitaire en euros" inputMode="decimal" className="field text-right tabular-nums" placeholder="0,00" value={l.price}
                onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
              <button aria-label="Supprimer la ligne" className="h-9 w-9 rounded-lg text-mute hover:bg-sand disabled:opacity-30" disabled={lines.length === 1}
                onClick={() => setLines(lines.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <button className="mt-3 text-lagoon font-semibold text-[15px]" onClick={() => setLines([...lines, { label: "", qty: "1", price: "" }])}>+ Ajouter un article</button>
      </div>

      <div className="panel p-5 sm:p-6 space-y-4">
        {terminals.length > 1 && (
          <div>
            <label className="label" htmlFor="term">Borne</label>
            <select id="term" className="field" value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
              {terminals.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="vat">TVA</label>
            <select id="vat" className="field" value={vat} onChange={(e) => setVat(parseFloat(e.target.value))}>
              {VAT_RATES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pay">Paiement</label>
            <select id="pay" className="field" value={pay} onChange={(e) => setPay(e.target.value)}>
              {["CB", "CB sans contact", "Espèces", "Chèque", "Virement", "Autre"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-sand">
          <span className="font-semibold">Total TTC</span>
          <span className="text-[32px] font-extrabold tabular-nums">{money(total)}</span>
        </div>
        <div className="flex justify-between text-[14px] text-mute -mt-2">
          <span>dont TVA</span><span className="tabular-nums">{money(vatCents)}</span>
        </div>
        {error && <p role="alert" className="text-alert">{error}</p>}
        <button className="btn btn-primary w-full h-14 text-[17px]" disabled={busy || !total} onClick={send}>
          {busy ? "Envoi…" : "Envoyer le ticket sur la borne"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Bornes ---------- */
function Bornes({ merchant, terminals, reload }: { merchant: Merchant; terminals: Terminal[]; reload: () => void }) {
  const [label, setLabel] = useState("");
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const out: Record<string, string> = {};
      for (const t of terminals) out[t.code] = await QRCode.toDataURL(`${siteUrl()}/t/${t.code}`, { margin: 1, width: 200 });
      setQrs(out);
    })();
  }, [terminals]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await supabase().from("terminals").insert({ merchant_id: merchant.id, label: label.trim() || `Caisse ${terminals.length + 1}` });
    setLabel(""); reload();
  }
  async function rename(t: Terminal) {
    const v = window.prompt("Nom de la borne", t.label);
    if (v && v.trim()) { await supabase().from("terminals").update({ label: v.trim() }).eq("id", t.id); reload(); }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {terminals.map((t) => {
          const url = `${siteUrl()}/t/${t.code}`;
          return (
            <div key={t.id} className="panel p-5 flex gap-5">
              {qrs[t.code] && <img src={qrs[t.code]} alt={`QR code de ${t.label}`} width={112} height={112} className="rounded-lg border border-sand-deep shrink-0" />}
              <div className="min-w-0">
                <div className="font-semibold text-[18px]">{t.label}</div>
                <div className="mt-1 text-[13px] font-mono text-ink-soft break-all">{url}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-ghost h-9 px-3 text-[14px]" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(t.code); setTimeout(() => setCopied(null), 1500); }}>
                    {copied === t.code ? "Lien copié" : "Copier le lien NFC"}
                  </button>
                  <Link href={`/pro/borne/${t.code}`} target="_blank" className="btn btn-ghost h-9 px-3 text-[14px]">Imprimer le chevalet</Link>
                  <button className="btn btn-ghost h-9 px-3 text-[14px]" onClick={() => rename(t)}>Renommer</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={add} className="panel p-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="bl">Ajouter une borne</label>
          <input id="bl" className="field" placeholder={`Caisse ${terminals.length + 1}`} value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <button className="btn btn-primary">Créer la borne</button>
      </form>

      <section className="panel p-6">
        <h2 className="font-semibold text-[18px]">Programmer l’autocollant NFC</h2>
        <ol className="mt-3 space-y-2 text-ink-soft leading-[1.6] list-decimal pl-5">
          <li>Achetez des autocollants NFC NTAG213 ou NTAG215 (quelques centimes l’unité).</li>
          <li>Installez l’application gratuite NFC Tools sur votre téléphone.</li>
          <li>Écrire › Ajouter un enregistrement › URL, puis collez le lien NFC de la borne.</li>
          <li>Approchez l’autocollant pour l’écrire, puis verrouillez-le (Autres › Verrouiller) pour qu’il ne soit pas modifié.</li>
          <li>Collez-le sous le chevalet imprimé, à côté du terminal de paiement.</li>
        </ol>
      </section>
    </div>
  );
}

/* ---------- Tickets émis ---------- */
function Tickets({ merchant }: { merchant: Merchant }) {
  const [rows, setRows] = useState<Receipt[] | null>(null);
  const [stats, setStats] = useState<{ total: number; claimed: number; today: number; revenue_cents: number } | null>(null);
  useEffect(() => {
    (async () => {
      const sb = supabase();
      const [{ data }, { data: s }] = await Promise.all([
        sb.from("receipts").select("*").eq("merchant_id", merchant.id).order("created_at", { ascending: false }).limit(100),
        sb.rpc("merchant_stats"),
      ]);
      setRows((data as Receipt[]) ?? []);
      setStats(s as typeof stats);
    })();
  }, [merchant.id]);
  if (!rows) return <Spinner />;
  const rate = stats && stats.total ? Math.round((stats.claimed / stats.total) * 100) : 0;
  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Tickets émis", String(stats.total)],
            ["Aujourd’hui", String(stats.today)],
            ["Récupérés", `${rate} %`],
            ["Papier économisé", `${(stats.total * 0.3).toFixed(1).replace(".", ",")} m`],
          ].map(([l, v]) => (
            <div key={l} className="panel p-4">
              <div className="text-[14px] text-mute">{l}</div>
              <div className="mt-1 text-[24px] font-bold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-ink-soft">Aucun ticket émis pour l’instant. Lancez-vous depuis l’onglet Encaisser.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="text-left text-mute text-[13.5px]">
              <tr><th className="p-4 font-medium">N°</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Paiement</th><th className="p-4 font-medium">Statut</th><th className="p-4 font-medium text-right">Montant</th></tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {rows.map((r) => {
                const expired = r.status === "pending" && Date.now() - new Date(r.created_at).getTime() > 5 * 60e3;
                return (
                  <tr key={r.id}>
                    <td className="p-4 font-mono text-[13.5px]">{r.number}</td>
                    <td className="p-4 whitespace-nowrap">{dateTime(r.created_at)}</td>
                    <td className="p-4">{r.payment_method}</td>
                    <td className="p-4">
                      <span className={`text-[13px] font-semibold rounded-full px-2.5 py-1 ${r.status === "claimed" ? "bg-lagoon-soft text-lagoon" : expired ? "bg-sand text-mute" : "bg-mango-soft text-ink"}`}>
                        {r.status === "claimed" ? "Récupéré" : expired ? "Non récupéré" : "En attente"}
                      </span>
                    </td>
                    <td className="p-4 text-right tabular-nums font-medium">{money(r.total_cents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- API ---------- */
function Api({ merchant, terminals }: { merchant: Merchant; terminals: Terminal[] }) {
  const [show, setShow] = useState(false);
  const base = siteUrl();
  const code = terminals[0]?.code ?? "CODE_BORNE";
  const curl = `curl -X POST ${base}/api/v1/receipts \\
  -H "Authorization: Bearer ${show ? merchant.api_key : "VOTRE_CLE_API"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "terminal": "${code}",
    "payment_method": "CB",
    "vat_rate": 0.085,
    "items": [
      { "label": "Bokit poulet", "qty": 2, "unit_price": 6.00 },
      { "label": "Jus de goyave", "qty": 1, "unit_price": 3.50 }
    ]
  }'`;
  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-ink-soft leading-[1.6]">
        Votre logiciel de caisse peut envoyer chaque vente à tikèt. Le ticket apparaît alors sur la borne sans rien saisir.
        Transmettez ces informations à votre éditeur de caisse.
      </p>
      <div className="panel p-5">
        <div className="label">Clé API</div>
        <div className="flex flex-wrap gap-3 items-center">
          <code className="font-mono text-[14px] break-all bg-sand rounded-lg px-3 py-2">{show ? merchant.api_key : "tk_live_••••••••••••••••"}</code>
          <button className="btn btn-ghost h-9 px-3 text-[14px]" onClick={() => setShow(!show)}>{show ? "Masquer" : "Afficher"}</button>
        </div>
        <p className="mt-2 text-[14px] text-mute">Gardez-la secrète : elle permet d’émettre des tickets à votre nom.</p>
      </div>
      <div className="panel p-5">
        <div className="label">Exemple de requête</div>
        <pre className="font-mono text-[13px] bg-ink text-sand rounded-xl p-4 overflow-x-auto whitespace-pre">{curl}</pre>
        <p className="mt-3 text-[14px] text-ink-soft leading-[1.6]">
          Réponse : <code className="font-mono">{"{ id, number, url, status }"}</code>. Le champ <code className="font-mono">url</code> est le lien direct du ticket,
          utile pour l’imprimer en QR code sur l’écran client. Vous pouvez envoyer <code className="font-mono">total</code> (en euros) à la place des articles.
        </p>
      </div>
    </div>
  );
}

/* ---------- Réglages ---------- */
function Reglages({ merchant, reload }: { merchant: Merchant; reload: () => void }) {
  const [f, setF] = useState({
    name: merchant.name, address: merchant.address ?? "", siret: merchant.siret ?? "", category: merchant.category,
    google_review_url: merchant.google_review_url ?? "", receipt_footer: merchant.receipt_footer ?? "",
  });
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setState("busy");
    await supabase().from("merchants").update({
      name: f.name.trim(), address: f.address.trim() || null, siret: f.siret.trim() || null, category: f.category,
      google_review_url: f.google_review_url.trim() || null, receipt_footer: f.receipt_footer.trim() || null,
    }).eq("id", merchant.id);
    setState("saved"); reload(); setTimeout(() => setState("idle"), 2000);
  }
  return (
    <form onSubmit={save} className="panel p-6 space-y-4 max-w-xl">
      <div><label className="label" htmlFor="rn">Nom du commerce</label><input id="rn" required className="field" value={f.name} onChange={set("name")} /></div>
      <div><label className="label" htmlFor="rc">Activité</label>
        <select id="rc" className="field" value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="label" htmlFor="ra">Adresse</label><textarea id="ra" rows={2} className="field" value={f.address} onChange={set("address")} /></div>
      <div><label className="label" htmlFor="rs">SIRET</label><input id="rs" className="field" value={f.siret} onChange={set("siret")} /></div>
      <div><label className="label" htmlFor="rg">Lien d’avis Google</label><input id="rg" type="url" className="field" placeholder="https://g.page/r/…/review" value={f.google_review_url} onChange={set("google_review_url")} /></div>
      <div><label className="label" htmlFor="rf">Message en bas du ticket</label><input id="rf" className="field" placeholder="Merci de votre visite" value={f.receipt_footer} onChange={set("receipt_footer")} /></div>
      <button className="btn btn-primary" disabled={state === "busy"}>{state === "saved" ? "Modifications enregistrées" : state === "busy" ? "Enregistrement…" : "Enregistrer les modifications"}</button>
      <div className="pt-4 border-t border-sand">
        <button type="button" className="text-ink-soft underline underline-offset-4" onClick={async () => { await supabase().auth.signOut(); window.location.href = "/"; }}>Me déconnecter</button>
      </div>
    </form>
  );
}
