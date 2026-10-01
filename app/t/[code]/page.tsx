"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";

type Info = { merchant_name: string; label: string } | null;

export default function TapPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<Info | undefined>(undefined);
  const [state, setState] = useState<"waiting" | "timeout">("waiting");
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    const sb = supabase();
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function attempt() {
      if (stopped.current) return;
      await sb.auth.getSession(); // make sure the session (if any) is attached before tapping
      const { data } = await sb.rpc("tap_terminal", { p_code: code });
      if (data && (data as { id: string }).id) {
        const d = data as { id: string; token: string };
        router.replace(`/r/${d.id}?k=${d.token}`);
        return;
      }
      tries++;
      if (tries >= 45) { setState("timeout"); return; }
      timer = setTimeout(attempt, 2000);
    }

    sb.rpc("terminal_info", { p_code: code }).then(({ data }) => {
      setInfo((data as Info) ?? null);
      if (data) attempt();
    });
    return () => { stopped.current = true; clearTimeout(timer); };
  }, [code, router, state === "waiting"]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <Logo />
      {info === undefined ? (
        <p className="mt-10 text-ink-soft">Connexion à la borne…</p>
      ) : info === null ? (
        <>
          <h1 className="mt-10 text-[24px] font-bold">Borne inconnue</h1>
          <p className="mt-2 text-ink-soft max-w-[34ch]">Cette borne n’est pas encore activée. Demandez votre ticket au commerçant.</p>
        </>
      ) : state === "waiting" ? (
        <>
          <span className="relative mt-12 grid place-items-center h-24 w-24 rounded-full bg-lagoon-soft nfc-pulse">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0f5c5a" strokeWidth="2" strokeLinecap="round"><path d="M6 8.3a6 6 0 0 1 0 7.4M9.5 6a10 10 0 0 1 0 12M13 4a14 14 0 0 1 0 16"/></svg>
          </span>
          <h1 className="mt-10 text-[26px] font-bold tracking-tight">{info.merchant_name}</h1>
          <p className="mt-2 text-ink-soft max-w-[32ch]">
            Votre ticket s’affichera ici dès que le paiement sera validé en caisse. Gardez cette page ouverte.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-10 text-[24px] font-bold">Aucun ticket en attente</h1>
          <p className="mt-2 text-ink-soft max-w-[34ch]">
            {info.merchant_name} n’a pas encore envoyé de ticket sur cette borne. Approchez à nouveau votre téléphone après le paiement.
          </p>
          <button className="btn btn-primary mt-6" onClick={() => setState("waiting")}>Réessayer</button>
        </>
      )}
    </main>
  );
}
