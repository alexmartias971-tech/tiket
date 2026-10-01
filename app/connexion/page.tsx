"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";

function translate(msg: string) {
  if (/Invalid login/i.test(msg)) return "Email ou mot de passe incorrect.";
  if (/invalid_email/i.test(msg)) return "Cette adresse email n’est pas valide.";
  if (/weak_password/i.test(msg)) return "Choisissez un mot de passe d’au moins 8 caractères.";
  if (/already_registered|already registered/i.test(msg)) return "Un compte existe déjà avec cet email. Connectez-vous.";
  if (/Email not confirmed/i.test(msg)) return "Confirmez votre adresse via le lien reçu par email, puis connectez-vous.";
  if (/rate limit/i.test(msg)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (/at least 6/i.test(msg)) return "Le mot de passe doit contenir au moins 6 caractères.";
  return msg;
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role");
  const next = params.get("next") || (role === "pro" ? "/pro" : "/app");
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "login" ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setInfo(null);
    const sb = supabase();
    try {
      if (mode === "signup") {
        const { error } = await sb.rpc("register_user", { p_email: email, p_password: password });
        if (error) throw error;
        const { error: e2 } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (e2) throw e2;
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace(next);
    } catch (err) {
      setError(translate((err as Error).message));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <Logo />
        <h1 className="mt-8 text-[30px] font-bold tracking-tight leading-tight">
          {mode === "signup"
            ? role === "pro" ? "Créez votre espace commerçant" : "Créez votre espace tickets"
            : "Connexion"}
        </h1>
        <p className="mt-2 text-ink-soft">
          {mode === "signup"
            ? role === "pro" ? "Vous configurerez votre commerce et votre première borne juste après." : "Gratuit. Vos tickets restent privés."
            : "Retrouvez vos tickets et votre espace commerçant."}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pw">Mot de passe</label>
            <input id="pw" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-alert text-[15px]">{error}</p>}
          {info && <p role="status" className="text-lagoon text-[15px]">{info}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Me connecter"}
          </button>
        </form>
        <p className="mt-6 text-[15px] text-ink-soft">
          {mode === "signup" ? "Déjà un compte ? " : "Pas encore de compte ? "}
          <button className="font-semibold text-lagoon underline underline-offset-4" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); setInfo(null); }}>
            {mode === "signup" ? "Se connecter" : "Créer un compte"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
