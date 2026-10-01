"use client";
import { useState } from "react";

const fmt = (n: number, d = 0) => n.toLocaleString("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d });

/** Paper saved per year, with every assumption editable by the merchant. */
export function SavingsCalculator() {
  const [perDay, setPerDay] = useState(80);
  const [days, setDays] = useState(26);
  const [rollPrice, setRollPrice] = useState(2.5);
  const [perRoll, setPerRoll] = useState(350);
  const [ticketCm, setTicketCm] = useState(20);

  const tickets = perDay * days * 12;
  const rolls = Math.ceil(tickets / Math.max(1, perRoll));
  const euros = rolls * rollPrice;
  const km = (tickets * ticketCm) / 100000;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] items-start">
      <div>
        <label htmlFor="perday" className="block text-[17px] font-semibold">Tickets par jour</label>
        <div className="mt-3 flex items-center gap-4">
          <input id="perday" type="range" min={10} max={600} step={10} value={perDay}
            onChange={(e) => setPerDay(+e.target.value)} className="w-full accent-[var(--color-lagoon)]" />
          <output htmlFor="perday" className="w-14 text-right text-[22px] font-bold tabular-nums">{perDay}</output>
        </div>
        <label htmlFor="days" className="mt-7 block text-[17px] font-semibold">Jours ouverts par mois</label>
        <div className="mt-3 flex items-center gap-4">
          <input id="days" type="range" min={4} max={31} value={days}
            onChange={(e) => setDays(+e.target.value)} className="w-full accent-[var(--color-lagoon)]" />
          <output htmlFor="days" className="w-14 text-right text-[22px] font-bold tabular-nums">{days}</output>
        </div>
        <details className="mt-7 text-[15px] text-ink-soft">
          <summary className="cursor-pointer font-medium text-ink">Modifier les hypothèses</summary>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <label className="text-[13px]">Prix d’un rouleau (€)
              <input type="number" step="0.1" min="0" className="field mt-1 h-11" value={rollPrice} onChange={(e) => setRollPrice(+e.target.value || 0)} />
            </label>
            <label className="text-[13px]">Tickets par rouleau
              <input type="number" min="1" className="field mt-1 h-11" value={perRoll} onChange={(e) => setPerRoll(+e.target.value || 1)} />
            </label>
            <label className="text-[13px]">Longueur d’un ticket (cm)
              <input type="number" min="1" className="field mt-1 h-11" value={ticketCm} onChange={(e) => setTicketCm(+e.target.value || 1)} />
            </label>
          </div>
          <p className="mt-3 text-[13px] text-mute">Valeurs par défaut : rouleau 80 mm × 80 m, ticket moyen de 20 cm. Ajustez avec vos propres chiffres.</p>
        </details>
      </div>

      <div className="rounded-[28px] bg-night text-white p-7 sm:p-9">
        <p className="text-white/70 text-[15px]">Sur une année, sans tikèt, vous imprimez</p>
        <p className="mt-2 display text-[64px] sm:text-[84px] tabular-nums">{fmt(km, km < 10 ? 1 : 0)} km</p>
        <p className="text-white/80 text-[17px]">de papier thermique, soit {fmt(tickets)} tickets.</p>
        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-6">
          <div>
            <div className="text-[34px] font-bold tabular-nums">{fmt(rolls)}</div>
            <div className="text-white/70 text-[14px]">rouleaux à acheter et à changer</div>
          </div>
          <div>
            <div className="text-[34px] font-bold tabular-nums text-mango">{fmt(euros)} €</div>
            <div className="text-white/70 text-[14px]">de papier, chaque année</div>
          </div>
        </div>
      </div>
    </div>
  );
}
