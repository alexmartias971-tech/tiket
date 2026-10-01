import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ReceiptView } from "@/components/ReceiptView";

const sample = {
  number: "T261001-0042",
  merchant_name: "Ti Kaz Bokit",
  total_cents: 1950,
  vat_cents: 153,
  payment_method: "CB sans contact",
  purchased_at: "2026-10-01T12:24:00-04:00",
  items: [
    { label: "Bokit poulet", qty: 2, unit_cents: 600 },
    { label: "Jus de goyave", qty: 1, unit_cents: 350 },
    { label: "Sorbet coco", qty: 1, unit_cents: 400 },
  ],
  merchant: { name: "TI KAZ BOKIT", address: "Rue Frébault\n97110 Pointe-à-Pitre", footer: "Mèsi, a pli ta !" },
};

export default function Home() {
  return (
    <main>
      <header className="mx-auto max-w-6xl px-4 sm:px-6 h-20 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4 text-[15px] font-medium">
          <Link href="/app" className="px-3 py-2 rounded-lg hover:bg-paper">Mes tickets</Link>
          <Link href="/pro" className="btn btn-primary h-10 px-4 text-[15px]">Espace commerçant</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-20 grid gap-14 lg:grid-cols-[1.15fr_1fr] items-center">
        <div>
          <h1 className="text-[44px] leading-[1.02] sm:text-[68px] font-extrabold tracking-[-0.035em]">
            Le ticket de caisse, sans le papier.
          </h1>
          <p className="mt-6 text-[19px] leading-[1.55] text-ink-soft max-w-[34ch]">
            Le client paie, approche son téléphone de la borne tikèt et son ticket s’ouvre.
            Rien à installer, rien à imprimer.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/connexion?role=pro" className="btn btn-primary">Équiper mon commerce</Link>
            <Link href="/demo" className="btn btn-ghost">Voir un ticket exemple</Link>
          </div>
          <p className="mt-6 text-[14px] text-mute">Fonctionne avec tous les téléphones NFC (iPhone XS et plus, Android) ou par QR code.</p>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-[300px]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-4 w-[320px] rounded-full bg-ink/90" aria-hidden />
            <ReceiptView r={sample} className="printing" />
          </div>
          <div className="absolute -bottom-8 left-0 sm:left-6 lg:-left-6 panel px-4 py-3 flex items-center gap-3 shadow-[0_10px_30px_rgba(15,92,90,0.15)]">
            <span className="relative grid place-items-center h-10 w-10 rounded-full bg-lagoon-soft nfc-pulse">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f5c5a" strokeWidth="2" strokeLinecap="round"><path d="M6 8.3a6 6 0 0 1 0 7.4M9.5 6a10 10 0 0 1 0 12M13 4a14 14 0 0 1 0 16"/></svg>
            </span>
            <div className="text-[14px] leading-tight">
              <div className="font-semibold">Ticket reçu</div>
              <div className="text-mute">en 1 seconde, par NFC</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <h2 className="text-[34px] sm:text-[42px] font-bold tracking-[-0.025em] max-w-[22ch]">Trois gestes au comptoir</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              ["Vous encaissez", "Saisissez le montant sur tikèt depuis un téléphone ou une tablette, ou laissez votre logiciel de caisse l’envoyer automatiquement."],
              ["Le client approche son téléphone", "La borne NFC posée à côté du terminal de paiement ouvre son ticket. Un QR code imprimé sur la borne sert de secours."],
              ["Il garde son ticket", "Téléchargement en PDF, rangement dans son espace, statistiques de dépenses et export pour ses notes de frais."],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="grid place-items-center h-10 w-10 rounded-full bg-mango font-bold text-[17px]">{i + 1}</span>
                <div>
                  <h3 className="text-[20px] font-semibold">{t}</h3>
                  <p className="mt-2 text-ink-soft leading-[1.6]">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-6 md:grid-cols-2">
        <div className="panel p-8">
          <h2 className="text-[26px] font-bold tracking-tight">Pour les commerçants</h2>
          <ul className="mt-5 space-y-3 text-ink-soft leading-[1.55]">
            <li>Plus de rouleaux thermiques à acheter ni de tickets qui finissent par terre.</li>
            <li>Conforme à la loi anti-gaspillage : depuis le 1er août 2023, imprimer le ticket par défaut est interdit.</li>
            <li>Votre lien d’avis Google affiché sur chaque ticket, au moment où le client est satisfait.</li>
            <li>Une API simple pour brancher votre logiciel de caisse.</li>
          </ul>
          <Link href="/connexion?role=pro" className="btn btn-primary mt-8">Créer mon espace commerçant</Link>
        </div>
        <div className="panel p-8">
          <h2 className="text-[26px] font-bold tracking-tight">Pour les clients</h2>
          <ul className="mt-5 space-y-3 text-ink-soft leading-[1.55]">
            <li>Le ticket s’ouvre dans le navigateur, sans application ni inscription.</li>
            <li>Tous vos tickets au même endroit, avec recherche et filtres.</li>
            <li>Vos dépenses par mois et par catégorie.</li>
            <li>Photographiez aussi vos tickets papier pour tout centraliser, et exportez en CSV.</li>
          </ul>
          <Link href="/connexion" className="btn btn-ghost mt-8">Créer mon espace gratuit</Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-lagoon text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start">
          <div>
            <h2 className="text-[34px] sm:text-[42px] font-bold tracking-[-0.025em]">Un prix simple, sans engagement</h2>
            <p className="mt-4 text-white/80 text-[18px] leading-[1.55] max-w-[38ch]">
              Pour les clients, tikèt est gratuit. Les commerçants paient la borne une fois, puis un abonnement mensuel.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] bg-white/10 p-6">
              <div className="text-white/80">Borne NFC + QR</div>
              <div className="mt-2 text-[40px] font-extrabold">49 €</div>
              <div className="text-white/70">une fois, par point de caisse</div>
            </div>
            <div className="rounded-[20px] bg-mango text-ink p-6">
              <div className="text-ink-soft">Abonnement</div>
              <div className="mt-2 text-[40px] font-extrabold">19 €<span className="text-[18px] font-semibold">/mois</span></div>
              <div className="text-ink-soft">tickets illimités, sans engagement</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-wrap gap-6 justify-between text-[14px] text-mute">
        <span>tikèt · Guadeloupe</span>
        <div className="flex gap-5">
          <Link href="/confidentialite" className="hover:text-ink">Confidentialité</Link>
          <Link href="/pro" className="hover:text-ink">Espace commerçant</Link>
          <Link href="/app" className="hover:text-ink">Mes tickets</Link>
        </div>
      </footer>
    </main>
  );
}
