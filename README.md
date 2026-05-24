# PST Learning Management System

Next.js 16 LMS SaaS app prepared for Cloudflare with:

- OpenNext Cloudflare adapter for deployment
- Cloudflare D1 for serverless SQLite data
- Cloudflare R2 for training material storage
- Drizzle ORM for schema and migrations
- NextAuth credentials login

## Cloudflare Resources

Create the production resources once:

```bash
npm run cf:create:d1
npm run cf:create:r2
```

After `cf:create:d1`, copy the returned `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "lms-saas-db"
database_id = "paste-real-database-id-here"
```

The configured R2 bucket is:

- `lms-saas-training-materials` for uploaded PDFs, PPTs, and videos

## GitHub Deployment

Deployment is automated by `.github/workflows/deploy-cloudflare.yml`.

Add these GitHub repository secrets before pushing to `main`:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `AUTH_SECRET`

The Cloudflare API token needs permission to deploy Workers, manage D1, manage R2, and edit Worker secrets for this account.

Every push to `main` will:

1. Install dependencies with `npm ci`
2. Run TypeScript checks
3. Apply D1 migrations to the remote D1 database
4. Build and deploy the OpenNext Cloudflare Worker
5. Sync `AUTH_SECRET` to Cloudflare Worker secrets

## Secrets

Set production secrets in Cloudflare:

```bash
npx wrangler secret put AUTH_SECRET
```

Use a strong random value. For local development, copy `.env.example` or `.dev.vars.example` and set the same key locally.

## Database Migrations

Local D1:

```bash
npm run db:migrate:local
```

Production D1:

```bash
npm run db:migrate:remote
```

Migrations currently include:

- `drizzle/0000_perpetual_harpoon.sql` for schema
- `drizzle/0001_seed_demo_data.sql` for demo users, jobsites, trainings, certificates, and landing settings

Demo password for all seeded users is:

```txt
password123
```

Demo users:

- `superadmin@demo.com`
- `siteadmin@demo.com`
- `manager@demo.com`
- `trainer@demo.com`
- `trainee@demo.com`

## Deploy

Build and deploy to Cloudflare:

```bash
npm run deploy
```

Preview a production build locally through Wrangler:

```bash
npm run preview
```

## Development

Run local Next dev with Cloudflare binding support:

```bash
npm run dev
```

For local data, apply D1 migrations first:

```bash
npm run db:migrate:local
```

## Verification

```bash
npx tsc --noEmit
npm run build
npx opennextjs-cloudflare build
```

`npm run lint` currently reports existing project lint debt around `any`, unused imports, and one `require()` usage in a server action.
