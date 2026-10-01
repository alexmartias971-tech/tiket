import Link from "next/link";
import { Mark } from "@/components/Logo";
import { ReceiptView } from "@/components/ReceiptView";
import { HeroDemo } from "@/components/HeroDemo";
import { SavingsCalculator } from "@/components/SavingsCalculator";

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
  merchant: { name: "TI KAZ BOKIT", address: "Rue Frébault\n97110 Pointe-à-Pitre", footer: "Mèsi, a pli ta ! -10 % sur votre prochain jus avec ce ticket." },
};

const FAQ: [string, string][] = [
  ["Mes clients doivent-ils installer une application ?",
    "Non. Le ticket s’ouvre dans le navigateur du téléphone, comme une page web. Le client peut le télécharger en PDF tout de suite. Créer un espace pour garder ses tickets est facultatif."],
  ["Et si le téléphone n’a pas de NFC ?",
    "Chaque borne porte aussi un QR code. Tous les iPhone depuis le XS et la quasi-totalité des Android récents lisent le NFC sans réglage ; les autres scannent le QR avec l’appareil photo."],
  ["Comment le ticket arrive-t-il sur la borne ?",
    "Vous saisissez le montant sur tikèt depuis un téléphone ou une tablette, en quelques secondes. Si votre logiciel de caisse sait envoyer une requête web, il peut le faire automatiquement grâce à notre API."],
  ["Deux clients peuvent-ils récupérer le même ticket ?",
    "Non. Un ticket est remis au premier téléphone qui touche la borne dans les 5 minutes après l’encaissement, puis il disparaît de la borne."],
  ["Est-ce conforme à la loi ?",
    "Oui. Depuis le 1er août 2023, le ticket ne doit plus être imprimé par défaut (loi anti-gaspillage). tikèt ne demande ni e-mail ni numéro de téléphone pour remettre le ticket, ce qui va dans le sens des recommandations de la CNIL."],
  ["Et si un client veut quand même un ticket papier ?",
    "Vous pouvez toujours l’imprimer à sa demande, la loi le prévoit. tikèt couvre tous ceux qui préfèrent le garder dans leur téléphone."],
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      {/* ───────── Hero ───────── */}
      <section className="bg-night text-white overflow-hidden">
        <header className="mx-auto max-w-6xl px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-[22px] tracking-tight">
            <Mark /> <span>tikèt</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-[15px] font-medium">
            <a href="#fonctionnement" className="hidden md:block px-3 py-2 text-white/80 hover:text-white">Comment ça marche</a>
            <a href="#tarif" className="hidden md:block px-3 py-2 text-white/80 hover:text-white">Tarif</a>
            <Link href="/connexion?mode=login" className="px-3 py-2 text-white/80 hover:text-white">Connexion</Link>
            <Link href="/commencer" className="btn btn-mango h-10 px-4 text-[15px]">Essayer</Link>
          </nav>
        </header>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-16 lg:pb-24 grid gap-12 lg:grid-cols-[1.05fr_1fr] items-center">
          <div>
            <h1 className="display text-[62px] sm:text-[92px] lg:text-[104px]">
              Le ticket arrive dans le téléphone.
            </h1>
            <p className="mt-7 text-[19px] sm:text-[21px] leading-[1.5] text-white/80 max-w-[36ch]">
              Votre client paie, pose son téléphone sur la borne tikèt et repart avec son ticket.
              Sans appli, sans e-mail, sans papier.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/commencer" className="btn btn-mango btn-lg">Essayer gratuitement</Link>
              <Link href="/demo" className="btn btn-onnight btn-lg">Voir un vrai ticket</Link>
            </div>
            <ul className="mt-8 grid gap-2 text-[15px] text-white/75">
              <li className="flex items-center gap-2.5"><span className="text-foam"><Check /></span>iPhone, Android, et QR code de secours</li>
              <li className="flex items-center gap-2.5"><span className="text-foam"><Check /></span>Prêt en 2 minutes, testé avec votre propre téléphone</li>
            </ul>
          </div>
          <HeroDemo />
        </div>
      </section>

      {/* ───────── The law hook ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-end">
        <h2 className="display-md text-[40px] sm:text-[60px] max-w-[16ch]">
          Depuis août 2023, le ticket ne s’imprime plus par défaut.
        </h2>
        <div className="text-[18px] leading-[1.6] text-ink-soft space-y-4">
          <p>
            La loi anti-gaspillage l’interdit. Pourtant vos clients en ont encore besoin : notes de frais,
            garanties, retours, comptes du mois.
          </p>
          <p>
            Avec tikèt, ils l’ont en une seconde, sans vous donner leur e-mail. Vous, vous n’achetez plus
            de rouleaux et chaque ticket travaille pour vous.
          </p>
        </div>
      </section>

      {/* ───────── What the receipt does ───────── */}
      <section id="fonctionnement" className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <h2 className="display-md text-[40px] sm:text-[60px] max-w-[18ch]">Un ticket qui travaille pour vous.</h2>
          <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_340px_1fr] items-center">
            <div className="space-y-10 lg:text-right">
              <div>
                <h3 className="text-[21px] font-semibold">Vos avis Google, au bon moment</h3>
                <p className="mt-2 text-ink-soft leading-[1.6]">Un bouton sous chaque ticket, quand le client vient d’être servi et qu’il est content.</p>
              </div>
              <div>
                <h3 className="text-[21px] font-semibold">Votre message en pied de ticket</h3>
                <p className="mt-2 text-ink-soft leading-[1.6]">Une offre pour la prochaine visite, vos horaires, votre Instagram. Vous le changez quand vous voulez.</p>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[340px] -rotate-[1.5deg]">
              <ReceiptView r={sample} />
            </div>
            <div className="space-y-10">
              <div>
                <h3 className="text-[21px] font-semibold">Il ne se perd plus</h3>
                <p className="mt-2 text-ink-soft leading-[1.6]">Le client le télécharge en PDF ou le range dans son espace gratuit, avec ses dépenses par mois.</p>
              </div>
              <div>
                <h3 className="text-[21px] font-semibold">Vous savez qui l’a pris</h3>
                <p className="mt-2 text-ink-soft leading-[1.6]">Votre tableau de bord affiche chaque ticket émis, récupéré ou non, et votre chiffre du jour.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Calculator ───────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <h2 className="display-md text-[40px] sm:text-[60px] max-w-[18ch]">Combien de papier part à la poubelle ?</h2>
        <p className="mt-5 mb-12 text-[18px] text-ink-soft max-w-[52ch] leading-[1.6]">
          Le papier thermique ne se recycle pas. Faites le calcul pour votre commerce.
        </p>
        <SavingsCalculator />
      </section>

      {/* ───────── Setup steps ───────── */}
      <section className="bg-lagoon text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <h2 className="display-md text-[40px] sm:text-[56px] max-w-[20ch]">Installé avant votre prochain client.</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              ["Créez votre compte", "Nom du commerce, adresse, message de pied de ticket. Vous voyez votre ticket se construire pendant que vous tapez."],
              ["Testez avec votre téléphone", "Une borne virtuelle s’active tout de suite avec son QR code. Envoyez-vous un premier ticket pour voir ce que verront vos clients."],
              ["Posez la borne au comptoir", "Commandez la borne NFC depuis votre espace. Elle se pose à côté du terminal de paiement, sans câble ni réglage."],
            ].map(([t, d], i) => (
              <li key={t}>
                <span className="display text-[64px] text-mango">{i + 1}</span>
                <h3 className="mt-3 text-[22px] font-semibold">{t}</h3>
                <p className="mt-2 text-white/80 leading-[1.6]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Comparison ───────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-28">
        <h2 className="display-md text-[40px] sm:text-[56px]">Papier ou tikèt ?</h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[16px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="py-3 pr-4 font-medium text-mute w-[38%]"></th>
                <th scope="col" className="py-3 pr-4 font-semibold">Ticket papier</th>
                <th scope="col" className="py-3 font-semibold text-lagoon">tikèt</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Coût pour vous", "Rouleaux, imprimante, pannes", "Un abonnement fixe"],
                ["Ce que garde le client", "Un papier qui s’efface et se perd", "Un PDF et un historique"],
                ["Avis Google", "Rien", "Un bouton sur chaque ticket"],
                ["Données demandées au client", "Aucune", "Aucune"],
                ["Recyclage", "Papier thermique non recyclable", "Rien à jeter"],
                ["Suivi des ventes", "Non", "Tableau de bord en direct"],
              ].map(([k, a, b]) => (
                <tr key={k} className="border-b border-sand-deep">
                  <th scope="row" className="py-4 pr-4 font-medium">{k}</th>
                  <td className="py-4 pr-4 text-ink-soft">{a}</td>
                  <td className="py-4 font-medium">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="tarif" className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid gap-12 lg:grid-cols-[1fr_1.1fr] items-center">
          <div>
            <h2 className="display-md text-[40px] sm:text-[60px]">Un prix, sans engagement.</h2>
            <p className="mt-5 text-[18px] text-ink-soft leading-[1.6] max-w-[40ch]">
              Créez votre compte et testez gratuitement avec le QR code. L’abonnement démarre quand votre borne est livrée.
              Pour vos clients, tikèt est toujours gratuit.
            </p>
          </div>
          <div className="rounded-[32px] border-2 border-ink p-8 sm:p-10">
            <div className="flex items-end gap-3">
              <span className="display text-[88px] sm:text-[104px]">19 €</span>
              <span className="pb-4 text-[18px] text-ink-soft">par mois<br />et par caisse</span>
            </div>
            <p className="mt-1 text-[17px]">+ 49 € une fois pour la borne NFC</p>
            <ul className="mt-8 grid gap-3 text-[16px]">
              {["Tickets illimités", "Bouton d’avis Google et message personnalisé", "Tableau de bord et historique des ventes", "API pour logiciel de caisse", "Résiliable à tout moment"].map((x) => (
                <li key={x} className="flex items-center gap-3"><span className="text-lagoon"><Check /></span>{x}</li>
              ))}
            </ul>
            <Link href="/commencer" className="btn btn-primary btn-lg w-full mt-9">Essayer gratuitement</Link>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20 sm:py-28">
        <h2 className="display-md text-[40px] sm:text-[56px]">Vos questions</h2>
        <div className="mt-10 border-t border-sand-deep">
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq border-b border-sand-deep">
              <summary className="flex items-center justify-between gap-6 py-5 text-[18px] font-semibold">
                {q}
                <span className="chev shrink-0 text-[26px] font-light leading-none text-lagoon" aria-hidden>+</span>
              </summary>
              <p className="pb-6 text-ink-soft leading-[1.65] max-w-[62ch]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="bg-night text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="display text-[52px] sm:text-[88px] max-w-[14ch] mx-auto">Votre premier ticket sans papier, aujourd’hui.</h2>
          <p className="mt-6 text-[18px] text-white/75">2 minutes pour créer votre compte. Aucune carte bancaire demandée.</p>
          <Link href="/commencer" className="btn btn-mango btn-lg mt-10">Essayer gratuitement</Link>
        </div>
        <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-8 border-t border-white/10 flex flex-wrap gap-6 justify-between text-[14px] text-white/60">
          <span>tikèt, fait en Guadeloupe</span>
          <div className="flex gap-5">
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
            <Link href="/pro" className="hover:text-white">Espace commerçant</Link>
            <Link href="/app" className="hover:text-white">Mes tickets</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
