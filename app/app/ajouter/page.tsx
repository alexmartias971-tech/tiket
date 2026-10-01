"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/format";

function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AddPage() {
  const router = useRouter();
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localNow());
  const [category, setCategory] = useState<string>("Alimentation");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) { setError("Indiquez un montant valide, par exemple 24,90."); return; }
    setBusy(true); setError(null);
    const sb = supabase();
    const { data: u } = await sb.auth.getUser();
    const uid = u.user!.id;
    let file_path: string | null = null;
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      file_path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await sb.storage.from("uploads").upload(file_path, file, { contentType: file.type });
      if (upErr) { setError(`Envoi de la photo impossible : ${upErr.message}`); setBusy(false); return; }
    }
    const { data, error } = await sb.from("receipts").insert({
      owner_id: uid, source: "upload", status: "manual",
      merchant_name: merchant.trim(), category, total_cents: cents,
      purchased_at: new Date(date).toISOString(), file_path, note: note.trim() || null, payment_method: "—",
    }).select("id").single();
    if (error) { setError(`Enregistrement impossible : ${error.message}`); setBusy(false); return; }
    router.replace(`/app/ticket/${data.id}`);
  }

  return (
    <div className="pt-2">
      <h1 className="text-[24px] font-bold tracking-tight">Ajouter un ticket papier</h1>
      <p className="mt-1 text-ink-soft">Gardez une trace des achats faits chez des commerces sans borne tikèt.</p>

      <form onSubmit={save} className="mt-6 space-y-5">
        <div className="panel p-5">
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Aperçu du ticket" className="w-full max-h-[360px] object-contain rounded-xl bg-sand" />
              <button type="button" className="btn btn-ghost h-9 px-3 mt-3 text-[14px]" onClick={() => { setFile(null); setPreview(null); }}>Retirer la photo</button>
            </div>
          ) : file ? (
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{file.name}</span>
              <button type="button" className="btn btn-ghost h-9 px-3 text-[14px]" onClick={() => setFile(null)}>Retirer</button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className="btn btn-primary" onClick={() => camRef.current?.click()}>Photographier le ticket</button>
              <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Choisir une image ou un PDF</button>
              <p className="sm:col-span-2 text-[14px] text-mute">Conseil : posez le ticket à plat sur une surface sombre, bien éclairé.</p>
            </div>
          )}
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <div>
          <label className="label" htmlFor="m">Commerce</label>
          <input id="m" required className="field" placeholder="Ex. Village Hardware" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="a">Montant TTC (€)</label>
            <input id="a" required inputMode="decimal" className="field tabular-nums" placeholder="24,90" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="c">Catégorie</label>
            <select id="c" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="d">Date et heure</label>
          <input id="d" type="datetime-local" required className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="n">Note (facultatif)</label>
          <textarea id="n" rows={2} className="field" placeholder="Ex. note de frais, garantie 2 ans" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le ticket"}</button>
      </form>
    </div>
  );
}
