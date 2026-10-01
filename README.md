# tikèt — le ticket de caisse sans papier

Le client paie, approche son téléphone de la borne NFC (ou scanne le QR code) et son ticket s'ouvre dans le navigateur. Il peut le télécharger en PDF, l'enregistrer dans son espace, suivre ses dépenses et exporter en CSV.

## Stack

- Next.js 16 (App Router) déployé sur Vercel
- Supabase (Postgres + Auth + Storage), région Paris
- Aucune clé secrète côté serveur : toute la logique sensible est dans des fonctions SQL `SECURITY DEFINER` protégées par jeton, clé API ou session.

## Pages

| Route | Rôle |
|---|---|
| `/` | Site vitrine |
| `/connexion` | Inscription / connexion (clients et commerçants) |
| `/t/[code]` | URL écrite dans l'autocollant NFC de la borne : récupère le dernier ticket en attente (fenêtre de 5 min) |
| `/r/[id]?k=…` | Ticket public (lien secret) : PDF, enregistrement, avis Google |
| `/app` | Espace client : tickets, recherche, filtres, export CSV |
| `/app/ajouter` | Photo ou PDF d'un ticket papier |
| `/app/stats` | Dépenses par mois, par catégorie, par commerce |
| `/pro` | Espace commerçant : encaisser, bornes, tickets émis, API, réglages |
| `/pro/borne/[code]` | Chevalet A6 imprimable avec QR code |
| `POST /api/v1/receipts` | API pour logiciels de caisse (clé `Bearer tk_live_…`) |

## API caisse

```bash
curl -X POST https://<domaine>/api/v1/receipts \
  -H "Authorization: Bearer tk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"terminal":"abc123","payment_method":"CB","vat_rate":0.085,
       "items":[{"label":"Bokit poulet","qty":2,"unit_price":6}]}'
```

Réponse `201` : `{ id, number, terminal, status: "pending", total, url }`.

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Base de données

Le schéma complet (tables, RLS, fonctions) est dans `supabase/schema.sql` : copier-coller dans l’éditeur SQL d’un projet Supabase vierge.

## Développement

```bash
npm install
npm run dev
```
