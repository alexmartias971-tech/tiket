export const CATEGORIES = [
  "Alimentation",
  "Restaurant",
  "Bricolage",
  "Mode",
  "Santé",
  "Beauté",
  "Transport",
  "Loisirs",
  "Fournitures",
  "Services",
  "Autre",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentation: "#0f5c5a",
  Restaurant: "#f4a51c",
  Bricolage: "#6b8f3a",
  Mode: "#b8321f",
  Santé: "#3a6ea5",
  Beauté: "#c46a9b",
  Transport: "#5a5f9e",
  Loisirs: "#d9822b",
  Fournitures: "#2f8f83",
  Services: "#7c8784",
  Autre: "#a7b0ad",
};

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const money = (cents: number) => eur.format((cents || 0) / 100);

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
export const timeOnly = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function siteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://tiket.vercel.app";
}

export type Item = { label: string; qty: number; unit_cents: number };

export type Receipt = {
  id: string;
  number: string | null;
  merchant_name: string;
  category: string;
  total_cents: number;
  vat_cents: number;
  currency: string;
  items: Item[];
  payment_method: string;
  status: "pending" | "claimed" | "manual";
  source: "pos" | "api" | "upload";
  file_path: string | null;
  note: string | null;
  purchased_at: string;
  claimed_at: string | null;
  created_at: string;
  access_token?: string;
  terminal_id?: string | null;
  merchant_id?: string | null;
};

export function toCsv(rows: Receipt[]) {
  const head = ["Date", "Commerce", "Catégorie", "Montant TTC", "dont TVA", "Paiement", "N° ticket", "Origine"];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      new Date(r.purchased_at).toLocaleString("fr-FR"),
      r.merchant_name,
      r.category,
      (r.total_cents / 100).toFixed(2).replace(".", ","),
      (r.vat_cents / 100).toFixed(2).replace(".", ","),
      r.payment_method,
      r.number ?? "",
      r.source === "upload" ? "Ajouté manuellement" : "Tikèt",
    ].map(esc).join(";")
  );
  return "﻿" + [head.map(esc).join(";"), ...lines].join("\n");
}

export function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
