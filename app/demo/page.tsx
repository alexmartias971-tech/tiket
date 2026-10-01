import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ReceiptView } from "@/components/ReceiptView";

export const metadata = { title: "Exemple de ticket · tikèt" };

export default function Demo() {
  return (
    <main className="min-h-dvh pb-16">
      <header className="mx-auto max-w-md px-4 h-16 flex items-center"><Logo /></header>
      <div className="mx-auto max-w-md px-4">
        <p className="text-center text-ink-soft">Voici ce que voit votre client après avoir approché son téléphone.</p>
        <h1 className="text-center text-[26px] font-bold tracking-tight mt-1">Ti Kaz Bokit</h1>
        <div className="mt-6">
          <ReceiptView r={{
            number: "T261001-0042", merchant_name: "Ti Kaz Bokit", total_cents: 1950, vat_cents: 153,
            payment_method: "CB sans contact", purchased_at: new Date().toISOString(),
            items: [
              { label: "Bokit poulet", qty: 2, unit_cents: 600 },
              { label: "Jus de goyave", qty: 1, unit_cents: 350 },
              { label: "Sorbet coco", qty: 1, unit_cents: 400 },
            ],
            merchant: { name: "TI KAZ BOKIT", address: "Rue Frébault\n97110 Pointe-à-Pitre", footer: "Mèsi, a pli ta !" },
          }} />
        </div>
        <div className="mt-8 space-y-3">
          <div className="btn btn-primary w-full opacity-60" aria-disabled>Télécharger en PDF</div>
          <div className="btn btn-ghost w-full opacity-60" aria-disabled>Enregistrer dans mes tickets</div>
          <div className="btn btn-mango w-full opacity-60" aria-disabled>Laisser un avis à Ti Kaz Bokit</div>
          <p className="text-center text-[14px] text-mute pt-2">Ticket d’exemple : commerce fictif.</p>
          <Link href="/commencer" className="btn btn-primary w-full">Équiper mon commerce</Link>
        </div>
      </div>
    </main>
  );
}
