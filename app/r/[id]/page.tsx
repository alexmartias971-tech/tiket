"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { ReceiptView, type ReceiptData } from "@/components/ReceiptView";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

type Pub = ReceiptData & {
  id: string; owned: boolean; is_mine: boolean;
  merchant: (ReceiptData["merchant"] & { google_review_url?: string | null }) | null;
};

function Inner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const token = params.get("k") ?? "";
  const autoClaim = params.get("claim") === "1";
  const { session, loading } = useSession();
  const [r, setR] = useState<Pub | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [claimState, setClaimState] = useState<"idle" | "busy" | "done" | "taken">("idle");

  const load = useCallback(async () => {
    const { data } = await supabase().rpc("get_receipt", { p_id: id, p_token: token });
    if (!data) setNotFound(true); else setR(data as Pub);
    return data as Pub | null;
  }, [id, token]);

  const claim = useCallback(async () => {
    setClaimState("busy");
    const { data } = await supabase().rpc("claim_receipt", { p_id: id, p_token: token });
    setClaimState(data ? "done" : "taken");
  }, [id, token]);

  useEffect(() => {
    if (loading) return;
    load().then((d) => {
      if (!d) return;
      if (d.is_mine) setClaimState("done");
      else if (session && autoClaim) claim();
    });
  }, [loading, session, autoClaim, load, claim]);

  if (notFound) return (
    <main className="min-h-dvh grid place-items-center px-4 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 text-[24px] font-bold">Ticket introuvable</h1>
        <p className="mt-2 text-ink-soft max-w-[36ch]">Le lien est incomplet ou a expiré. Demandez au commerçant de vous le renvoyer.</p>
      </div>
    </main>
  );
  if (!r) return <Spinner label="Ouverture du ticket" />;

  const next = `/r/${id}?k=${token}&claim=1`;

  return (
    <main className="min-h-dvh pb-16">
      <header className="no-print mx-auto max-w-md px-4 h-16 flex items-center justify-between">
        <Logo />
        {session ? <Link href="/app" className="text-[15px] font-medium text-lagoon">Mes tickets</Link> : null}
      </header>
      <div className="mx-auto max-w-md px-4">
        <p className="no-print text-center text-ink-soft">Votre ticket chez</p>
        <h1 className="no-print text-center text-[26px] font-bold tracking-tight">{r.merchant?.name ?? r.merchant_name}</h1>
        <div className="mt-6 print-area">
          <ReceiptView r={r} />
        </div>

        <div className="no-print mt-8 space-y-3">
          <button className="btn btn-primary w-full" onClick={() => window.print()}>Télécharger en PDF</button>

          {claimState === "done" ? (
            <Link href="/app" className="btn btn-ghost w-full">Enregistré dans mes tickets · voir</Link>
          ) : claimState === "taken" ? (
            <p className="text-center text-ink-soft">Ce ticket est déjà enregistré dans un autre espace.</p>
          ) : session ? (
            <button className="btn btn-ghost w-full" onClick={claim} disabled={claimState === "busy"}>
              {claimState === "busy" ? "Enregistrement…" : "Enregistrer dans mes tickets"}
            </button>
          ) : (
            <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="btn btn-ghost w-full">Enregistrer dans mes tickets</Link>
          )}

          {r.merchant?.google_review_url && (
            <a href={r.merchant.google_review_url} target="_blank" rel="noreferrer" className="btn btn-mango w-full">
              Laisser un avis à {r.merchant.name}
            </a>
          )}
          {!session && (
            <p className="pt-2 text-center text-[14px] text-mute leading-[1.55]">
              Avec un espace gratuit, vos tickets sont rangés automatiquement et vous suivez vos dépenses.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
