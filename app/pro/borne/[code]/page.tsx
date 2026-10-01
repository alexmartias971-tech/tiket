"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { Mark } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/format";

export default function Chevalet() {
  const { code } = useParams<{ code: string }>();
  const [qr, setQr] = useState<string | null>(null);
  const [name, setName] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`${siteUrl()}/t/${code}`, { margin: 1, width: 600, color: { dark: "#1c2422", light: "#ffffff" } }).then(setQr);
    supabase().rpc("terminal_info", { p_code: code }).then(({ data }) => data && setName((data as { merchant_name: string }).merchant_name));
  }, [code]);
  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-sand print:bg-white">
      <div className="w-[105mm] min-h-[148mm] bg-paper rounded-[18px] print:rounded-none p-8 flex flex-col items-center text-center border border-sand-deep">
        <div className="flex items-center gap-2 font-bold text-[20px]"><Mark size={26} /> tikèt</div>
        <h1 className="mt-6 text-[26px] leading-[1.1] font-extrabold tracking-tight">Votre ticket, sans papier</h1>
        <p className="mt-3 text-[15px] text-ink-soft leading-snug">Après le paiement, approchez votre téléphone ici ou scannez le code.</p>
        {qr && <img src={qr} alt="QR code de la borne" className="mt-6 w-[52mm] h-[52mm]" />}
        <div className="mt-auto pt-6 text-[13px] text-mute">{name}</div>
      </div>
      <button className="no-print btn btn-primary mt-6" onClick={() => window.print()}>Imprimer</button>
    </main>
  );
}
