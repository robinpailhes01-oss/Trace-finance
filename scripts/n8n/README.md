# Workflow n8n — Scraping agences digitales Hérault & Gard

## Fichiers

- `scripts/supabase/prospects_agences.sql` : script SQL à exécuter dans l'éditeur SQL de Supabase
- `scripts/n8n/agency-scraper-workflow.json` : workflow n8n à importer via **Workflows → Import from File / JSON**

## Notes de configuration

### 1. Apify
- Créer un compte sur [apify.com](https://apify.com).
- Récupérer l'API token dans **Settings → Integrations → API token**.
- Dans n8n, créer une credential de type **Header Auth** :
  - Name : `token`
  - Value : `[le token Apify]`
- Dans les nœuds HTTP Request « Apify - Run Scraper » et « Apify - Get Results », sélectionner cette credential si tu ne veux pas utiliser le token dans l'URL. Le workflow livré passe le token via `?token={{$credentials.apifyApiToken}}` — remplace par la référence à ta credential n8n (ou câble `{{$credentials.apifyApiToken}}` vers ta credential Header Auth).

### 2. Supabase
- Utiliser le **Session Pooler** :
  - Host : `aws-1-eu-west-1.pooler.supabase.com`
  - Port : **5432** (surtout **PAS 6543**)
  - SSL : activé
  - User : `postgres.[project-ref]` (ici `postgres.utyfpmjhtfoxsxncfoxee`)
- Credential n8n de type **Supabase** avec l'URL `https://utyfpmjhtfoxsxncfoxee.supabase.co` et la **service role key** (pour insert / select côté serveur).

### 3. Claude credential dans n8n
- Le test de connexion natif retourne toujours « resource not found » même avec une clé valide.
- **Sauvegarder la credential sans tester** et valider via une exécution réelle du workflow.
- Le workflow appelle l'API Claude via HTTP Request (credential `anthropicApi`) — modèle : `claude-sonnet-4-20250514`.

### 4. « Always Output Data » sur la vérification de doublon
- Activer le toggle **Always Output Data** sur le nœud **Supabase - Check Duplicate**.
- Sans ce toggle, n8n stoppe la branche si la requête ne retourne rien, et aucun nouveau lead n'est inséré.

### 5. Rate limiting Apify
- Wait de 45 s entre chaque run = marge confortable.
- Peut être abaissé à 30 s si les runs terminent rapidement ; surveiller la taille de dataset avant de réduire.

## Structure du workflow (ordre d'exécution)

1. **Manual Trigger**
2. **Queries** (Code) — tableau des 10 requêtes Google Maps
3. **Loop Over Queries** (SplitInBatches)
4. **Apify - Run Scraper** (POST `/acts/.../runs`)
5. **Wait 45s**
6. **Apify - Get Results** (GET `/runs/last/dataset/items`)
7. **Loop Over Leads** (SplitInBatches)
8. **Supabase - Check Duplicate** (Always Output Data ON)
9. **IF Duplicate** — TRUE : skip (retour à Loop Over Leads) / FALSE : continue
10. **IF Website** — OUI : Fetch Website → Claude → Parse / NON : Set Defaults
11. **Merge** (2 entrées)
12. **Supabase - Insert Lead**
13. Retour vers **Loop Over Leads** puis **Loop Over Queries**

## À vérifier au premier run

- Les champs Apify : selon l'Actor, les clés peuvent être `placeId`/`title`/`address`/`city`/`phone`/`website` (ce que le workflow attend) ou variantes. Ouvrir un item dans le dataset Apify pour confirmer et ajuster les mappings si besoin.
- Le `runs/last` renvoie bien le dernier run **de l'actor**, pas forcément celui qu'on vient de lancer si plusieurs runs tournent en parallèle. Pour un workflow séquentiel mono-utilisateur c'est OK.
