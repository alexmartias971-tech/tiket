"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/format";

type M = { id: string; name: string; category: string; google_review_url: string | null };
type T = { id: string; code: string; label: string };

/** First-run checklist: test with your own phone, then order the tile. */
export function ProWelcome({ merchant, terminal, onGoSettings }: { merchant: M; terminal: T; onGoSettings: () => void }) {
  const tapUrl = `${siteUrl()}/t/${terminal.code}`;
  const [qr, setQr] = useState<string | null>(null);
  const [test, setTest] = useState<{ id: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "pending" | "claimed">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(tapUrl, { margin: 1, width: 360, color: { dark: "#10201f", light: "#ffffff" } }).then(setQr);
  }, [tapUrl]);

  useEffect(() => {
    if (!test || status !== "pending") return;
    const t = setInterval(async () => {
      const { data } = await supabase().from("receipts").select("status").eq("id", test.id).single();
      if (data?.status === "claimed") setStatus("claimed");
    }, 2000);
    return () => clearInterval(t);
  }, [test, status]);

  async function sendTest() {
    setStatus("busy"); setError(null);
    const { data, error } = await supabase().from("receipts").insert({
      merchant_id: merchant.id, terminal_id: terminal.id, merchant_name: merchant.name, category: merchant.category,
      total_cents: 100, vat_cents: 8, items: [{ label: "Ticket test tikèt", qty: 1, unit_cents: 100 }],
      payment_method: "Test", status: "pending", source: "pos",
    }).select("id").single();
    if (error) { setError(error.message); setStatus("idle"); return; }
    setTest({ id: data.id });
    setStatus("pending");
  }

  return (
    <section className="rounded-[28px] bg-night text-white p-6 sm:p-9" aria-labelledby="welcome-title">
      <h2 id="welcome-title" className="display-md text-[34px] sm:text-[44px]">Testez votre borne avec votre téléphone.</h2>
      <p className="mt-3 text-white/75 max-w-[56ch]">
        Votre borne virtuelle est déjà active. Faites l’essai comme un client : c’est exactement ce qui se passera au comptoir.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] items-start">
        {qr && <img src={qr} alt="QR code de votre borne" width={180} height={180} className="rounded-[18px] bg-white p-2" />}
        <ol className="space-y-5">
          <li className="flex gap-4">
            <span className="display text-[34px] text-mango leading-none w-6">1</span>
            <p className="pt-1">Scannez ce QR code avec votre téléphone. La page reste ouverte et attend un ticket.</p>
          </li>
          <li className="flex gap-4">
            <span className="display text-[34px] text-mango leading-none w-6">2</span>
            <div className="pt-1">
              <p>Envoyez un ticket test de 1,00 €.</p>
              <button className="btn btn-mango mt-3" onClick={sendTest} disabled={status === "busy" || status === "pending"}>
                {status === "busy" ? "Envoi…" : status === "pending" ? "Ticket envoyé, regardez votre téléphone" : status === "claimed" ? "Envoyer un autre ticket test" : "Envoyer le ticket test"}
              </button>
              {error && <p role="alert" className="mt-2 text-[#ffb4a8]">{error}</p>}
            </div>
          </li>
          <li className="flex gap-4">
            <span className="display text-[34px] text-mango leading-none w-6">3</span>
            <p className="pt-1">
              {status === "claimed"
                ? "Votre téléphone a reçu le ticket. C’est ce que vivront vos clients."
                : "Le ticket s’affiche sur votre téléphone en une seconde."}
            </p>
          </li>
        </ol>
      </div>

      {!merchant.google_review_url && (
        <p className="mt-8 pt-6 border-t border-white/15 text-white/75">
          Ajoutez votre lien d’avis Google pour afficher un bouton « Laisser un avis » sous chaque ticket.{" "}
          <button className="font-semibold text-white underline underline-offset-4" onClick={onGoSettings}>Ajouter mon lien</button>
        </p>
      )}
    </section>
  );
}

/** Order the physical NFC tile. */
export function OrderTile({ merchantId }: { merchantId: string }) {
  const [orders, setOrders] = useState<{ id: string; quantity: number; status: string; created_at: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [pos, setPos] = useState("Aucun logiciel de caisse");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => supabase().from("orders").select("id,quantity,status,created_at").eq("merchant_id", merchantId)
    .order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
  useEffect(() => { load(); }, [merchantId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase().from("orders").insert({
      merchant_id: merchantId, quantity: qty, contact_name: contact.trim(), phone: phone.trim(),
      delivery_address: addr.trim(), pos_software: pos,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setOpen(false); load();
  }

  const label: Record<string, string> = { nouvelle: "Reçue, nous vous contactons", confirmee: "Confirmée", livree: "Livrée", annulee: "Annulée" };

  return (
    <section className="panel p-6 sm:p-8" aria-labelledby="order-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="order-title" className="text-[22px] font-bold">Borne NFC pour le comptoir</h2>
          <p className="mt-1 text-ink-soft max-w-[48ch]">Se pose à côté du terminal de paiement. Déjà programmée avec votre lien, avec QR code de secours. 49 € une fois par caisse.</p>
        </div>
        {!open && <button className="btn btn-primary" onClick={() => setOpen(true)}>{orders.length ? "Commander une autre borne" : "Commander ma borne"}</button>}
      </div>

      {orders.length > 0 && (
        <ul className="mt-5 divide-y divide-sand">
          {orders.map((o) => (
            <li key={o.id} className="py-3 flex justify-between gap-4 text-[15px]">
              <span>{o.quantity} borne{o.quantity > 1 ? "s" : ""}, commandée{o.quantity > 1 ? "s" : ""} le {new Date(o.created_at).toLocaleDateString("fr-FR")}</span>
              <span className="font-medium text-lagoon">{label[o.status] ?? o.status}</span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="oq">Nombre de bornes</label>
            <select id="oq" className="field" value={qty} onChange={(e) => setQty(+e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {n * 49} €</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="op">Logiciel de caisse</label>
            <select id="op" className="field" value={pos} onChange={(e) => setPos(e.target.value)}>
              {["Aucun logiciel de caisse", "Terminal de paiement seul", "Logiciel de caisse (autre)", "Je ne sais pas"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="oc">Votre nom</label>
            <input id="oc" required className="field" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ot">Téléphone</label>
            <input id="ot" required type="tel" inputMode="tel" className="field" placeholder="0690 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="oa">Adresse de livraison</label>
            <textarea id="oa" required rows={2} className="field" value={addr} onChange={(e) => setAddr(e.target.value)} />
          </div>
          {error && <p role="alert" className="sm:col-span-2 text-alert">{error}</p>}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" disabled={busy}>{busy ? "Envoi…" : `Commander pour ${qty * 49} €`}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
            <span className="text-[14px] text-mute">Rien n’est débité maintenant : nous vous appelons pour confirmer la livraison et le paiement.</span>
          </div>
        </form>
      )}
    </section>
  );
}
