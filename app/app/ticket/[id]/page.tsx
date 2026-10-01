"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { ReceiptView, type ReceiptData } from "@/components/ReceiptView";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, money, dateTime, type Receipt } from "@/lib/format";

type Full = ReceiptData & { merchant?: (ReceiptData["merchant"] & { google_review_url?: string | null }) | null };

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [r, setR] = useState<Receipt | null>(null);
  const [full, setFull] = useState<Full | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data } = await sb.from("receipts").select("*").eq("id", id).maybeSingle();
      if (!data) { setMissing(true); return; }
      setR(data as Receipt);
      if (data.source !== "upload") {
        const { data: f } = await sb.rpc("get_receipt", { p_id: id, p_token: data.access_token });
        if (f) setFull(f as Full);
      }
      if (data.file_path) {
        const { data: s } = await sb.storage.from("uploads").createSignedUrl(data.file_path, 3600);
        if (s) setFileUrl(s.signedUrl);
      }
    })();
  }, [id]);

  async function changeCategory(c: string) {
    if (!r) return;
    const sb = supabase();
    if (r.source === "upload") await sb.from("receipts").update({ category: c }).eq("id", r.id);
    else await sb.rpc("set_receipt_category", { p_id: r.id, p_category: c });
    setR({ ...r, category: c });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  async function remove() {
    if (!r) return;
    if (!window.confirm("Retirer ce ticket de votre espace ?")) return;
    const sb = supabase();
    if (r.file_path) await sb.storage.from("uploads").remove([r.file_path]);
    await sb.rpc("forget_receipt", { p_id: r.id });
    router.replace("/app");
  }

  if (missing) return (
    <div className="pt-10 text-center">
      <p className="text-ink-soft">Ce ticket n’existe pas ou n’est pas dans votre espace.</p>
      <Link href="/app" className="btn btn-ghost mt-4">Retour à mes tickets</Link>
    </div>
  );
  if (!r) return <Spinner />;

  return (
    <div className="pt-2">
      <Link href="/app" className="no-print inline-flex items-center gap-1 text-[15px] text-ink-soft hover:text-ink">‹ Mes tickets</Link>

      {r.source === "upload" ? (
        <div className="mt-4 panel p-6">
          <div className="text-[14px] text-mute">Ticket papier ajouté par vous</div>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">{r.merchant_name}</h1>
          <div className="mt-1 text-[30px] font-extrabold tabular-nums">{money(r.total_cents)}</div>
          <div className="mt-1 text-ink-soft">{dateTime(r.purchased_at)}</div>
          {r.note && <p className="mt-4 text-ink-soft">{r.note}</p>}
          {fileUrl && (
            /\.pdf$/i.test(r.file_path ?? "")
              ? <a href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost mt-5">Ouvrir le PDF</a>
              // eslint-disable-next-line @next/next/no-img-element
              : <a href={fileUrl} target="_blank" rel="noreferrer"><img src={fileUrl} alt={`Photo du ticket ${r.merchant_name}`} className="mt-5 w-full rounded-xl bg-sand max-h-[520px] object-contain" /></a>
          )}
        </div>
      ) : (
        <div className="mt-4 print-area max-w-[360px] mx-auto">
          <ReceiptView r={full ?? { ...r, merchant: null }} />
        </div>
      )}

      <div className="no-print mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="cat">Catégorie {saved && <span className="text-lagoon font-normal">· enregistrée</span>}</label>
          <select id="cat" className="field" value={r.category} onChange={(e) => changeCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {r.source !== "upload" && <button className="btn btn-primary" onClick={() => window.print()}>Télécharger en PDF</button>}
          {full?.merchant?.google_review_url && (
            <a className="btn btn-mango" href={full.merchant.google_review_url} target="_blank" rel="noreferrer">Laisser un avis Google</a>
          )}
          <button className="btn btn-ghost text-alert" onClick={remove}>Retirer de mon espace</button>
        </div>
      </div>
    </div>
  );
}
