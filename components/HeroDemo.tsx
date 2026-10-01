"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "tapping" | "received";

const ITEMS = [
  ["2 × Bokit poulet", "12,00"],
  ["Jus de goyave", "3,50"],
  ["Sorbet coco", "4,00"],
];

/** The one memorable moment of the page: a phone taps the tikèt tile and the receipt lands on screen. */
export function HeroDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scale, setScale] = useState(1);
  const wrap = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setPhase("idle");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setPhase("received"); return; }
    timers.current = [
      setTimeout(() => setPhase("tapping"), 60),
      setTimeout(() => setPhase("received"), 1250),
    ];
  }, []);

  useEffect(() => {
    const t = setTimeout(play, 1100);
    return () => { clearTimeout(t); timers.current.forEach(clearTimeout); };
  }, [play]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / 520)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tapped = phase === "tapping";
  const received = phase === "received";

  return (
    <div ref={wrap} className="relative w-full max-w-[520px] mx-auto" style={{ height: 540 * scale }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: 520, height: 540, transform: `scale(${scale})` }}>
        {/* Counter */}
        <div className="absolute left-0 right-6 bottom-6 h-[250px] rounded-[36px] bg-night-2 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" />

        {/* Payment terminal */}
        <div className="absolute left-[38px] bottom-[120px] w-[132px] h-[218px] rounded-[26px] bg-[#1b2524] shadow-[0_24px_40px_rgba(0,0,0,.35)] p-3 -rotate-[4deg]">
          <div className="h-[78px] rounded-[12px] bg-[#cfe9e3] grid place-items-center text-center px-2">
            <div className="font-mono text-[11px] leading-tight text-ink">
              <div className="font-semibold text-[15px]">19,50 €</div>
              <div className={received || tapped ? "" : "opacity-0"}>Paiement accepté</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-[6px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-[18px] rounded-[5px] ${i === 11 ? "bg-[#3aa36b]" : i === 9 ? "bg-[#c8463a]" : "bg-[#34403e]"}`} />
            ))}
          </div>
        </div>

        {/* tikèt tile */}
        <div className="absolute left-[190px] bottom-[64px] w-[150px]">
          <div className="relative h-[150px] rounded-[26px] bg-white shadow-[0_18px_30px_rgba(0,0,0,.3)] grid place-items-center">
            {tapped && <span className="tap-ring absolute inset-6 rounded-full border-[3px] border-foam" aria-hidden />}
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#0e6b67" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 8.3a6 6 0 0 1 0 7.4M9.5 6a10 10 0 0 1 0 12M13 4a14 14 0 0 1 0 16" />
            </svg>
            <span className={`absolute bottom-4 right-4 h-2.5 w-2.5 rounded-full ${received ? "bg-[#2fd27a] shadow-[0_0_10px_#2fd27a]" : "bg-[#9fb4af]"}`} />
            <span className="absolute top-3.5 left-4 font-bold text-[13px] text-night">tikèt</span>
          </div>
          <div className="mx-auto mt-[-6px] h-3 w-[120px] rounded-b-[10px] bg-[#cfd8d5]" />
        </div>

        {/* Phone */}
        <div
          className={`phone ${tapped ? "tapped" : received ? "after" : ""} absolute right-0 top-0 w-[208px] h-[420px] rounded-[38px] bg-[#0d1514] p-[9px] shadow-[0_30px_60px_rgba(0,0,0,.45)]`}
          style={{ ["--tap-x" as string]: "-108px", ["--tap-y" as string]: "70px" }}
        >
          <div className={`relative h-full w-full overflow-hidden rounded-[30px] bg-[#e9efed] ${received ? "buzz" : ""}`}>
            <div className="absolute left-1/2 top-2 -translate-x-1/2 h-[22px] w-[74px] rounded-full bg-[#0d1514] z-10" />
            {/* Lock screen */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0e6b67] to-[#05302e] text-white text-center pt-14">
              <div className="text-[46px] font-semibold tabular-nums leading-none">12:24</div>
              <div className="mt-1 text-[12px] opacity-80">jeudi 1 octobre</div>
              <div className={`mx-3 mt-8 rounded-[16px] bg-white/15 backdrop-blur px-3 py-2.5 text-left text-[11.5px] leading-snug transition-opacity duration-300 ${received ? "opacity-0" : "opacity-100"}`}>
                Approchez le téléphone de la borne pour recevoir votre ticket
              </div>
            </div>
            {/* Receipt screen */}
            <div className={`absolute inset-0 bg-[#eef3f1] ${received ? "receipt-in" : "translate-y-full"}`}>
              <div className="pt-10 px-3 text-center">
                <div className="text-[10.5px] text-ink-soft">Votre ticket chez</div>
                <div className="text-[15px] font-bold text-ink leading-tight">Ti Kaz Bokit</div>
              </div>
              <div className="mx-3 mt-3 rounded-[6px] bg-white px-3 py-3 font-mono text-[9.5px] leading-[1.55] text-ink shadow-sm">
                <div className="text-center font-semibold text-[11px]">TI KAZ BOKIT</div>
                <div className="text-center text-mute">Pointe-à-Pitre</div>
                <div className="my-2 border-t border-dashed border-[#c9d0cd]" />
                {ITEMS.map(([l, p]) => (
                  <div key={l} className="flex justify-between gap-2"><span>{l}</span><span>{p}</span></div>
                ))}
                <div className="my-2 border-t border-dashed border-[#c9d0cd]" />
                <div className="flex justify-between font-semibold text-[11.5px]"><span>TOTAL</span><span>19,50 €</span></div>
                <div className="mt-2 text-center text-mute">Mèsi, a pli ta !</div>
              </div>
              <div className="mx-3 mt-3 space-y-1.5">
                <div className="h-8 rounded-[9px] bg-lagoon text-white text-[11px] font-semibold grid place-items-center">Télécharger en PDF</div>
                <div className="h-8 rounded-[9px] bg-mango text-ink text-[11px] font-semibold grid place-items-center">Laisser un avis ★★★★★</div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={play}
          className="absolute right-[44px] bottom-0 text-[14px] font-medium text-white/80 hover:text-white underline underline-offset-4"
          aria-label="Rejouer la démonstration du tap"
        >
          {received ? "Rejouer" : "Lancer le tap"}
        </button>
      </div>
    </div>
  );
}
