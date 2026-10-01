"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ReceiptView } from "@/components/ReceiptView";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import { CATEGORIES } from "@/lib/format";

const STEPS = ["Votre commerce", "Votre ticket", "Votre compte"];

const SAMPLE_ITEMS: Record<string, { label: string; qty: number; unit_cents: number }[]> = {
  Restaurant: [{ label: "Plat du jour", qty: 2, unit_cents: 1400 }, { label: "Jus local", qty: 2, unit_cents: 400 }],
  Alimentation: [{ label: "Pain au beurre", qty: 2, unit_cents: 180 }, { label: "Jus de goyave", qty: 1, unit_cents: 350 }],
  Beauté: [{ label: "Coupe + brushing", qty: 1, unit_cents: 3500 }],
  Mode: [{ label: "T-shirt madras", qty: 1, unit_cents: 2900 }],
  Bricolage: [{ label: "Lot de vis inox", qty: 2, unit_cents: 690 }],
  Santé: [{ label: "Crème solaire SPF50", qty: 1, unit_cents: 1590 }],
};

function translate(msg: string) {
  if (/invalid_email/i.test(msg)) return "Cette adresse e-mail n’est pas valide.";
  if (/weak_password/i.test(msg)) return "Choisissez un mot de passe d’au moins 8 caractères.";
  if (/already_registered/i.test(msg)) return "Un compte existe déjà avec cet e-mail. Connectez-vous pour continuer.";
  if (/Invalid login/i.test(msg)) return "E-mail ou mot de passe incorrect.";
  return msg;
}

export default function Commencer() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Restaurant");
  const [address, setAddress] = useState("");
  const [footer, setFooter] = useState("Merci et à bientôt !");
  const [review, setReview] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already a merchant? Go straight to the dashboard.
  useEffect(() => {
    if (loading || !session) return;
    supabase().from("merchants").select("id").maybeSingle().then(({ data }) => { if (data) router.replace("/pro"); });
  }, [loading, session, router]);

  const items = SAMPLE_ITEMS[category] ?? [{ label: "Article", qty: 1, unit_cents: 1500 }];
  const total = items.reduce((s, i) => s + i.qty * i.unit_cents, 0);
  const preview = {
    number: "T000000-0001",
    merchant_name: name || "Votre commerce",
    total_cents: total,
    vat_cents: Math.round(total - total / 1.085),
    payment_method: "CB sans contact",
    purchased_at: new Date().toISOString(),
    items,
    merchant: { name: (name || "Votre commerce").toUpperCase(), address: address || null, footer: footer || null },
  };

  function next(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 1 && session) { create(); return; }
    if (step < 2) { setStep(step + 1); return; }
    create();
  }

  async function create() {
    setBusy(true); setError(null);
    const sb = supabase();
    try {
      if (!session) {
        const { error } = await sb.rpc("register_user", { p_email: email, p_password: password });
        if (error) throw error;
        const { error: e2 } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (e2) throw e2;
      }
      const { data: m, error: e3 } = await sb.from("merchants").insert({
        name: name.trim(), category, address: address.trim() || null,
        receipt_footer: footer.trim() || null, google_review_url: review.trim() || null,
      }).select("id").single();
      if (e3) throw e3;
      await sb.from("terminals").insert({ merchant_id: m.id, label: "Caisse 1" });
      router.replace("/pro?bienvenue=1");
    } catch (err) {
      setError(translate((err as Error).message));
      setBusy(false);
    }
  }

  const lastStep = session ? 1 : 2;

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1fr_minmax(420px,0.9fr)]">
      {/* Form side */}
      <div className="px-4 sm:px-10 py-6 lg:py-10 flex flex-col">
        <div className="flex items-center justify-between">
          <Logo />
          {!session && <Link href="/connexion?mode=login&next=/pro" className="text-[15px] text-ink-soft hover:text-ink">J’ai déjà un compte</Link>}
        </div>

        <div className="mt-10 lg:mt-16 w-full max-w-[460px] mx-auto lg:mx-0 lg:ml-[8%]">
          <ol className="flex gap-2" aria-label="Étapes">
            {STEPS.slice(0, lastStep + 1).map((s, i) => (
              <li key={s} className="flex-1">
                <span className={`block h-1.5 rounded-full ${i <= step ? "bg-lagoon" : "bg-sand-deep"}`} />
                <span className={`mt-2 block text-[13px] ${i === step ? "text-ink font-semibold" : "text-mute"}`}>{s}</span>
              </li>
            ))}
          </ol>

          <form onSubmit={next} className="mt-10">
            {step === 0 && (
              <>
                <h1 className="display-md text-[40px] sm:text-[48px]">Comment s’appelle votre commerce ?</h1>
                <p className="mt-3 text-ink-soft">Il apparaît en tête de chaque ticket. Regardez l’aperçu se remplir.</p>
                <div className="mt-8 space-y-5">
                  <div>
                    <label className="label" htmlFor="n">Nom du commerce</label>
                    <input id="n" required autoFocus className="field" placeholder="Ex. Ti Kaz Bokit" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <fieldset>
                    <legend className="label">Activité</legend>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter((c) => c !== "Autre").map((c) => (
                        <button type="button" key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                          className={`h-10 px-4 rounded-full text-[15px] border-[1.5px] ${category === c ? "bg-ink text-white border-ink" : "border-sand-deep bg-paper hover:border-ink-soft"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label className="label" htmlFor="a">Adresse (facultatif)</label>
                    <textarea id="a" rows={2} className="field" placeholder={"Rue Frébault\n97110 Pointe-à-Pitre"} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="display-md text-[40px] sm:text-[48px]">Que dit votre ticket ?</h1>
                <p className="mt-3 text-ink-soft">Un mot pour vos clients et, si vous voulez, un bouton vers vos avis Google.</p>
                <div className="mt-8 space-y-5">
                  <div>
                    <label className="label" htmlFor="f">Message en pied de ticket</label>
                    <textarea id="f" rows={2} maxLength={140} className="field" value={footer} onChange={(e) => setFooter(e.target.value)} />
                    <p className="mt-1.5 text-[13px] text-mute">Une offre, vos horaires, votre Instagram. Modifiable à tout moment.</p>
                  </div>
                  <div>
                    <label className="label" htmlFor="g">Lien vers vos avis Google (facultatif)</label>
                    <input id="g" type="url" inputMode="url" className="field" placeholder="https://g.page/r/…" value={review} onChange={(e) => setReview(e.target.value)} />
                    <p className="mt-1.5 text-[13px] text-mute">Dans Google Business Profile, bouton « Demander des avis ». Vous pourrez l’ajouter plus tard.</p>
                  </div>
                </div>
              </>
            )}

            {step === 2 && !session && (
              <>
                <h1 className="display-md text-[40px] sm:text-[48px]">Dernière étape : votre accès.</h1>
                <p className="mt-3 text-ink-soft">Pour retrouver votre tableau de bord. Aucune carte bancaire demandée.</p>
                <div className="mt-8 space-y-5">
                  <div>
                    <label className="label" htmlFor="e">E-mail</label>
                    <input id="e" type="email" required autoFocus autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="p">Mot de passe</label>
                    <input id="p" type="password" required minLength={8} autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <p className="mt-1.5 text-[13px] text-mute">8 caractères minimum.</p>
                  </div>
                </div>
              </>
            )}

            {error && <p role="alert" className="mt-5 text-alert">{error}</p>}

            <div className="mt-9 flex items-center gap-3">
              {step > 0 && (
                <button type="button" className="btn btn-ghost" onClick={() => { setStep(step - 1); setError(null); }}>Retour</button>
              )}
              <button className="btn btn-primary btn-lg flex-1" disabled={busy || (step === 0 && !name.trim())}>
                {busy ? "Création de votre espace…" : step === lastStep ? "Créer mon espace et ma borne" : "Continuer"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live preview side */}
      <aside className="bg-night px-4 sm:px-10 py-12 lg:py-0 lg:min-h-dvh grid place-items-center" aria-label="Aperçu du ticket">
        <div className="w-full max-w-[330px]">
          <p className="text-center text-[14px] text-white/70 mb-5">Ce que verront vos clients</p>
          <ReceiptView r={preview} />
          {review.trim() && (
            <div className="btn btn-mango w-full mt-4 pointer-events-none">Laisser un avis à {name || "votre commerce"}</div>
          )}
        </div>
      </aside>
    </main>
  );
}
