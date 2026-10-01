"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

export default function AccountPage() {
  const { session } = useSession();
  const router = useRouter();
  return (
    <div className="pt-2 space-y-5">
      <h1 className="text-[24px] font-bold tracking-tight">Mon compte</h1>
      <div className="panel p-5">
        <div className="text-[14px] text-mute">Connecté avec</div>
        <div className="mt-1 font-semibold break-all">{session?.user.email}</div>
      </div>
      <div className="panel p-5">
        <h2 className="font-semibold">Vous êtes commerçant ?</h2>
        <p className="mt-1 text-ink-soft">Installez une borne tikèt à votre caisse et envoyez vos tickets sans papier.</p>
        <Link href="/pro" className="btn btn-ghost mt-4">Ouvrir l’espace commerçant</Link>
      </div>
      <div className="panel p-5">
        <h2 className="font-semibold">Vos données</h2>
        <p className="mt-1 text-ink-soft leading-[1.6]">
          Vos tickets ne sont visibles que par vous. Le commerçant voit le ticket qu’il a émis, jamais votre email.
        </p>
        <Link href="/confidentialite" className="mt-3 inline-block text-lagoon font-medium underline underline-offset-4">Politique de confidentialité</Link>
      </div>
      <button className="btn btn-ghost w-full" onClick={async () => { await supabase().auth.signOut(); router.replace("/"); }}>
        Me déconnecter
      </button>
    </div>
  );
}
