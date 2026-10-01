import { Logo } from "@/components/Logo";

export const metadata = { title: "Confidentialité · tikèt" };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Logo />
      <h1 className="mt-10 text-[32px] font-bold tracking-tight">Confidentialité</h1>
      <div className="mt-6 space-y-5 text-ink-soft leading-[1.7]">
        <p>tikèt permet aux commerçants de remettre un ticket de caisse dématérialisé et aux clients de le conserver.</p>
        <h2 className="text-ink font-semibold text-[20px]">Sans compte</h2>
        <p>Approcher son téléphone de la borne ne demande aucune donnée personnelle : le ticket s’ouvre via un lien unique et secret. Nous n’utilisons pas de cookie de suivi.</p>
        <h2 className="text-ink font-semibold text-[20px]">Avec un espace client</h2>
        <p>Nous conservons votre email, vos tickets et les photos que vous ajoutez, uniquement pour vous les afficher. Le commerçant ne voit jamais votre email. Vos données ne sont ni vendues ni utilisées pour de la prospection.</p>
        <h2 className="text-ink font-semibold text-[20px]">Commerçants</h2>
        <p>Les tickets émis sont conservés pour l’historique du commerçant. Les données sont hébergées dans l’Union européenne (Paris).</p>
        <h2 className="text-ink font-semibold text-[20px]">Vos droits</h2>
        <p>Vous pouvez retirer un ticket de votre espace à tout moment, et demander l’accès, la rectification ou la suppression de vos données en écrivant à l’éditeur du service.</p>
      </div>
    </main>
  );
}
