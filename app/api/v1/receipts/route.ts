import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Body = {
  terminal?: string;
  total?: number;
  items?: { label?: string; qty?: number; unit_price?: number }[];
  vat_rate?: number;
  vat?: number;
  payment_method?: string;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const key = auth.replace(/^Bearer\s+/i, "").trim();
  if (!key) return NextResponse.json({ error: "missing_api_key" }, { status: 401, headers: cors });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: cors }); }

  const items = (body.items ?? []).map((i) => ({
    label: String(i.label ?? "Article").slice(0, 120),
    qty: Math.max(1, Math.round(Number(i.qty ?? 1))),
    unit_cents: Math.round(Number(i.unit_price ?? 0) * 100),
  })).filter((i) => Number.isFinite(i.unit_cents) && i.unit_cents >= 0);

  const total_cents = body.total != null
    ? Math.round(Number(body.total) * 100)
    : items.reduce((s, i) => s + i.qty * i.unit_cents, 0);
  if (!Number.isFinite(total_cents) || total_cents <= 0) {
    return NextResponse.json({ error: "invalid_total", message: "Send `total` (euros) or `items` with unit_price." }, { status: 400, headers: cors });
  }
  const vat_cents = body.vat != null
    ? Math.round(Number(body.vat) * 100)
    : body.vat_rate ? Math.round(total_cents - total_cents / (1 + Number(body.vat_rate))) : 0;

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("api_create_receipt", {
    p_api_key: key,
    p_terminal_code: body.terminal ?? null,
    p_total_cents: total_cents,
    p_items: items,
    p_vat_cents: Math.max(0, vat_cents || 0),
    p_payment_method: String(body.payment_method ?? "CB").slice(0, 40),
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("invalid_api_key")) return NextResponse.json({ error: "invalid_api_key" }, { status: 401, headers: cors });
    if (msg.includes("unknown_terminal")) return NextResponse.json({ error: "unknown_terminal" }, { status: 404, headers: cors });
    return NextResponse.json({ error: "server_error", message: msg }, { status: 500, headers: cors });
  }

  const d = data as { id: string; token: string; number: string; terminal: string };
  const origin = new URL(req.url).origin;
  return NextResponse.json(
    { id: d.id, number: d.number, terminal: d.terminal, status: "pending", total: total_cents / 100, url: `${origin}/r/${d.id}?k=${d.token}` },
    { status: 201, headers: cors }
  );
}
