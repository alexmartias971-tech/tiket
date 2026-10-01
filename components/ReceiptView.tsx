import { money, dateTime, type Item } from "@/lib/format";

export type ReceiptData = {
  number?: string | null;
  merchant_name: string;
  total_cents: number;
  vat_cents: number;
  items: Item[];
  payment_method: string;
  purchased_at: string;
  merchant?: { name: string; address?: string | null; siret?: string | null; footer?: string | null } | null;
};

export function ReceiptView({ r, className = "" }: { r: ReceiptData; className?: string }) {
  const items = Array.isArray(r.items) ? r.items : [];
  return (
    <div className={`receipt text-[13.5px] leading-relaxed ${className}`}>
      <div className="text-center">
        <div className="font-bold text-[17px] tracking-wide">{r.merchant?.name ?? r.merchant_name}</div>
        {r.merchant?.address && <div className="text-ink-soft whitespace-pre-line">{r.merchant.address}</div>}
        {r.merchant?.siret && <div className="text-ink-soft">SIRET {r.merchant.siret}</div>}
      </div>
      <hr />
      <div className="flex flex-wrap justify-between gap-x-4 text-ink-soft">
        <span>{dateTime(r.purchased_at)}</span>
        {r.number && <span>N° {r.number}</span>}
      </div>
      <hr />
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="min-w-0">
                {it.qty > 1 && <span className="text-ink-soft">{it.qty} × </span>}
                {it.label}
              </span>
              <span className="shrink-0 tabular-nums">{money(it.qty * it.unit_cents)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-ink-soft">Détail des articles non transmis</div>
      )}
      <hr />
      <div className="flex justify-between items-baseline">
        <span className="font-bold">TOTAL TTC</span>
        <span className="font-bold text-[20px] tabular-nums">{money(r.total_cents)}</span>
      </div>
      {r.vat_cents > 0 && (
        <div className="flex justify-between text-ink-soft">
          <span>dont TVA</span>
          <span className="tabular-nums">{money(r.vat_cents)}</span>
        </div>
      )}
      <div className="flex justify-between text-ink-soft">
        <span>Payé par</span>
        <span>{r.payment_method}</span>
      </div>
      <hr />
      <div className="text-center text-ink-soft">
        {r.merchant?.footer || "Merci de votre visite"}
        <div className="mt-1 text-[11.5px]">Ticket dématérialisé · tikèt</div>
      </div>
    </div>
  );
}
