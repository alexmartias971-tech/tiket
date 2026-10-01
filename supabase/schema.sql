-- tikèt — schéma Supabase (Postgres 17)
-- À exécuter dans un projet vierge (SQL editor). Aucune clé secrète n'est requise côté app :
-- tout passe par RLS + fonctions SECURITY DEFINER protégées par jeton, clé API ou session.

create extension if not exists pgcrypto with schema extensions;

-- ───────── Tables
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  address text,
  siret text,
  category text not null default 'Autre',
  google_review_url text,
  receipt_footer text,
  api_key text not null unique default ('tk_live_' || encode(extensions.gen_random_bytes(20), 'hex')),
  created_at timestamptz not null default now()
);

create table public.terminals (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  code text not null unique default lower(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 10)),
  label text not null default 'Caisse 1',
  created_at timestamptz not null default now()
);
create index on public.terminals (merchant_id);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants(id) on delete set null,
  terminal_id uuid references public.terminals(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  access_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  number text,
  merchant_name text not null,
  category text not null default 'Autre',
  total_cents integer not null check (total_cents >= 0),
  vat_cents integer not null default 0 check (vat_cents >= 0),
  currency text not null default 'EUR',
  items jsonb not null default '[]'::jsonb,
  payment_method text not null default 'CB',
  status text not null default 'pending' check (status in ('pending','claimed','manual')),
  source text not null default 'pos' check (source in ('pos','api','upload')),
  file_path text,
  note text,
  purchased_at timestamptz not null default now(),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.receipts (owner_id, purchased_at desc);
create index on public.receipts (merchant_id, created_at desc);
create index on public.receipts (terminal_id, status, created_at desc);

alter table public.merchants enable row level security;
alter table public.terminals enable row level security;
alter table public.receipts  enable row level security;

-- ───────── Policies
create policy merchants_owner_select on public.merchants for select to authenticated using (owner_id = (select auth.uid()));
create policy merchants_owner_insert on public.merchants for insert to authenticated with check (owner_id = (select auth.uid()));
create policy merchants_owner_update on public.merchants for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy merchants_owner_delete on public.merchants for delete to authenticated using (owner_id = (select auth.uid()));

create policy terminals_owner_all on public.terminals for all to authenticated
  using (exists (select 1 from public.merchants m where m.id = terminals.merchant_id and m.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.merchants m where m.id = terminals.merchant_id and m.owner_id = (select auth.uid())));

create policy receipts_select on public.receipts for select to authenticated using (
  owner_id = (select auth.uid())
  or exists (select 1 from public.merchants m where m.id = receipts.merchant_id and m.owner_id = (select auth.uid())));
create policy receipts_merchant_insert on public.receipts for insert to authenticated with check (
  (source = 'pos' and status = 'pending' and owner_id is null
     and exists (select 1 from public.merchants m where m.id = receipts.merchant_id and m.owner_id = (select auth.uid())))
  or (source = 'upload' and status = 'manual' and merchant_id is null and terminal_id is null and owner_id = (select auth.uid())));
create policy receipts_upload_update on public.receipts for update to authenticated
  using (source = 'upload' and owner_id = (select auth.uid())) with check (source = 'upload' and owner_id = (select auth.uid()));
create policy receipts_upload_delete on public.receipts for delete to authenticated
  using (source = 'upload' and owner_id = (select auth.uid()));

-- ───────── Storage (photos / PDF de tickets papier, dossier = id utilisateur)
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false) on conflict do nothing;
create policy uploads_own_select on storage.objects for select to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy uploads_own_insert on storage.objects for insert to authenticated with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy uploads_own_delete on storage.objects for delete to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ───────── Fonctions
create or replace function public.next_receipt_number(p_merchant uuid) returns text
language sql security definer set search_path to '' as $$
  select 'T' || to_char(now(), 'YYMMDD') || '-' || lpad((count(*) + 1)::text, 4, '0')
  from public.receipts where merchant_id = p_merchant and created_at::date = now()::date;
$$;

-- Garantit qu'un ticket ne vise qu'une borne du commerçant et fige le nom du commerce
create or replace function public.receipts_before_insert() returns trigger
language plpgsql security definer set search_path to '' as $$
declare m record;
begin
  if new.merchant_id is not null then
    select name, category into m from public.merchants where id = new.merchant_id;
    if not found then raise exception 'unknown_merchant'; end if;
    if new.terminal_id is not null and not exists (
      select 1 from public.terminals t where t.id = new.terminal_id and t.merchant_id = new.merchant_id) then
      raise exception 'terminal_not_owned' using errcode = '42501';
    end if;
    new.merchant_name := m.name;
    if new.category is null or new.category = 'Autre' then new.category := m.category; end if;
    if new.number is null then new.number := public.next_receipt_number(new.merchant_id); end if;
  end if;
  return new;
end; $$;
create trigger receipts_before_insert before insert on public.receipts for each row execute function public.receipts_before_insert();

create or replace function public.terminal_info(p_code text) returns json
language sql stable security definer set search_path to '' as $$
  select json_build_object('merchant_name', m.name, 'label', t.label, 'category', m.category)
  from public.terminals t join public.merchants m on m.id = t.merchant_id
  where t.code = lower(p_code);
$$;

-- Appelée quand le client approche son téléphone : dernier ticket en attente (< 5 min) de la borne
create or replace function public.tap_terminal(p_code text) returns json
language plpgsql security definer set search_path to '' as $$
declare r record;
begin
  select rc.id, rc.access_token into r
  from public.receipts rc join public.terminals t on t.id = rc.terminal_id
  where t.code = lower(p_code) and rc.status = 'pending' and rc.created_at > now() - interval '5 minutes'
  order by rc.created_at desc limit 1
  for update of rc skip locked;
  if not found then return null; end if;
  update public.receipts set status = 'claimed', claimed_at = now(), owner_id = coalesce(owner_id, auth.uid()) where id = r.id;
  return json_build_object('id', r.id, 'token', r.access_token);
end; $$;

create or replace function public.get_receipt(p_id uuid, p_token text) returns json
language sql stable security definer set search_path to '' as $$
  select json_build_object(
    'id', r.id, 'number', r.number, 'merchant_name', r.merchant_name, 'category', r.category,
    'total_cents', r.total_cents, 'vat_cents', r.vat_cents, 'currency', r.currency,
    'items', r.items, 'payment_method', r.payment_method, 'purchased_at', r.purchased_at,
    'status', r.status, 'owned', r.owner_id is not null, 'is_mine', r.owner_id = auth.uid(),
    'merchant', case when m.id is null then null else json_build_object(
       'name', m.name, 'address', m.address, 'siret', m.siret,
       'google_review_url', m.google_review_url, 'footer', m.receipt_footer) end)
  from public.receipts r left join public.merchants m on m.id = r.merchant_id
  where r.id = p_id and r.access_token = p_token;
$$;

-- API caisse (clé tk_live_…)
create or replace function public.api_create_receipt(p_api_key text, p_terminal_code text, p_total_cents integer,
  p_items jsonb default '[]'::jsonb, p_vat_cents integer default 0, p_payment_method text default 'CB') returns json
language plpgsql security definer set search_path to '' as $$
declare m record; t record; new_id uuid; new_token text; new_number text;
begin
  select * into m from public.merchants where api_key = p_api_key;
  if not found then raise exception 'invalid_api_key' using errcode = '28000'; end if;
  if p_terminal_code is null then
    select * into t from public.terminals where merchant_id = m.id order by created_at limit 1;
  else
    select * into t from public.terminals where merchant_id = m.id and code = lower(p_terminal_code);
  end if;
  if not found then raise exception 'unknown_terminal' using errcode = 'P0002'; end if;
  if p_total_cents is null or p_total_cents < 0 then raise exception 'invalid_total' using errcode = '22023'; end if;
  insert into public.receipts (merchant_id, terminal_id, merchant_name, category, total_cents, vat_cents, items, payment_method, status, source)
  values (m.id, t.id, m.name, m.category, p_total_cents, coalesce(p_vat_cents,0), coalesce(p_items,'[]'::jsonb), coalesce(p_payment_method,'CB'), 'pending', 'api')
  returning id, access_token, number into new_id, new_token, new_number;
  return json_build_object('id', new_id, 'token', new_token, 'number', new_number, 'terminal', t.code);
end; $$;

create or replace function public.claim_receipt(p_id uuid, p_token text) returns boolean
language plpgsql security definer set search_path to '' as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.receipts set owner_id = auth.uid(), status = 'claimed', claimed_at = coalesce(claimed_at, now())
   where id = p_id and access_token = p_token and (owner_id is null or owner_id = auth.uid());
  get diagnostics n = row_count;
  return n > 0;
end; $$;

create or replace function public.set_receipt_category(p_id uuid, p_category text) returns void
language sql security definer set search_path to '' as $$
  update public.receipts set category = p_category where id = p_id and owner_id = auth.uid();
$$;

create or replace function public.forget_receipt(p_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin
  delete from public.receipts where id = p_id and owner_id = auth.uid() and source = 'upload';
  update public.receipts set owner_id = null where id = p_id and owner_id = auth.uid();
end; $$;

create or replace function public.merchant_stats() returns json
language sql stable security definer set search_path to '' as $$
  select json_build_object('total', count(*), 'claimed', count(*) filter (where r.status = 'claimed'),
    'today', count(*) filter (where r.created_at::date = now()::date), 'revenue_cents', coalesce(sum(r.total_cents),0))
  from public.receipts r join public.merchants m on m.id = r.merchant_id where m.owner_id = auth.uid();
$$;

create or replace function public.my_stats() returns json
language sql stable security definer set search_path to '' as $$
  with mine as (select * from public.receipts where owner_id = auth.uid())
  select json_build_object(
    'count', (select count(*) from mine),
    'total_cents', (select coalesce(sum(total_cents),0) from mine),
    'month_cents', (select coalesce(sum(total_cents),0) from mine where date_trunc('month', purchased_at) = date_trunc('month', now())),
    'prev_month_cents', (select coalesce(sum(total_cents),0) from mine where date_trunc('month', purchased_at) = date_trunc('month', now()) - interval '1 month'),
    'month_count', (select count(*) from mine where date_trunc('month', purchased_at) = date_trunc('month', now())),
    'by_month', (select json_agg(json_build_object('month', to_char(mo, 'YYYY-MM'), 'cents', coalesce(s,0)) order by mo)
                 from (select gs mo, (select sum(total_cents) from mine where date_trunc('month', purchased_at) = gs) s
                       from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') gs) x),
    'by_category', (select json_agg(json_build_object('category', category, 'cents', s, 'count', c) order by s desc)
                    from (select category, sum(total_cents) s, count(*) c from mine group by category) y));
$$;
revoke execute on function public.my_stats() from anon;

-- Inscription sans e-mail de confirmation (MVP). À remplacer par l'inscription Supabase standard en production.
create or replace function public.register_user(p_email text, p_password text) returns json
language plpgsql security definer set search_path to '' as $$
declare uid uuid := gen_random_uuid(); e text := lower(trim(p_email));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then raise exception 'invalid_email' using errcode = '22023'; end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'weak_password' using errcode = '22023'; end if;
  if exists (select 1 from auth.users where email = e) then raise exception 'already_registered' using errcode = '23505'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', e,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', e, 'email_verified', true), 'email', now(), now(), now());
  return json_build_object('id', uid);
end; $$;

-- ───────── Commandes de bornes (depuis l'espace commerçant)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  quantity int not null default 1 check (quantity between 1 and 20),
  contact_name text not null,
  phone text not null,
  delivery_address text not null,
  pos_software text,
  note text,
  status text not null default 'nouvelle' check (status in ('nouvelle','confirmee','livree','annulee')),
  created_at timestamptz not null default now()
);
create index on public.orders (merchant_id, created_at desc);
alter table public.orders enable row level security;
create policy orders_owner_select on public.orders for select to authenticated
  using (exists (select 1 from public.merchants m where m.id = orders.merchant_id and m.owner_id = (select auth.uid())));
create policy orders_owner_insert on public.orders for insert to authenticated
  with check (status = 'nouvelle' and exists (select 1 from public.merchants m where m.id = orders.merchant_id and m.owner_id = (select auth.uid())));
