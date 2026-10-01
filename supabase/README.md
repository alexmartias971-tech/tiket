# Base de données

Le schéma (tables `merchants`, `terminals`, `receipts`, politiques RLS, fonctions RPC, bucket `uploads`)
est appliqué sur le projet Supabase `tiket` (région Paris) via deux migrations : `init_schema` et `register_user`.

Pour le récupérer à l'identique sur un nouveau projet :

```sql
select name, array_to_string(statements, E';\n')
from supabase_migrations.schema_migrations order by version;
```

Fonctions exposées :

- `terminal_info(code)` — nom du commerce pour la page de tap (public)
- `tap_terminal(code)` — récupère le dernier ticket en attente de la borne, fenêtre de 5 min (public)
- `get_receipt(id, token)` — lecture d'un ticket via son lien secret (public)
- `claim_receipt(id, token)` — range le ticket dans l'espace du client connecté
- `set_receipt_category(id, cat)`, `forget_receipt(id)` — gestion côté client
- `api_create_receipt(api_key, …)` — création d'un ticket par un logiciel de caisse
- `merchant_stats()` — compteurs du commerçant
- `register_user(email, password)` — inscription sans email de confirmation
