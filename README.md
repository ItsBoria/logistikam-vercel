# Logistikam — Vercel edition

This repository is the provider-independent version of Logistikam. It uses TanStack Start, React, Supabase, and Vercel. It does not require the Lovable runtime.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `ItsBoria/logistikam-vercel`.
2. Select the `codex/vercel-independent` branch for the first preview deployment.
3. Keep the detected build command (`npm run build`). Do not set a custom output directory.
4. Connect the existing Supabase project through the Vercel Marketplace integration.
5. Deploy and use the generated Preview URL for testing.

## Supabase environment variables

The code supports the variable names created by Vercel's Supabase integration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The database connection variables beginning with `POSTGRES_` are managed by the integration but are not used directly by this application.

Never expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with a public prefix.

## Push notification variables

VAPID values are not provided by Supabase. Generate a key pair once:

```bash
npx web-push generate-vapid-keys
```

Add the result in Vercel → Project → Settings → Environment Variables:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` (mark Sensitive)
- `VAPID_SUBJECT`, for example `mailto:you@example.com`

Apply them to Preview and Production, then redeploy. Keep the same VAPID key pair across deployments so existing notification subscriptions remain valid.

## Supabase authentication settings

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to the final production domain.
- Add the Vercel production URL to **Redirect URLs**.
- Add the Vercel preview wildcard, for example `https://*-your-vercel-team.vercel.app/**`.

In Supabase Dashboard → Authentication → Providers → Google, keep Google enabled and configure its Client ID and Client Secret. Google Cloud's authorized callback URL must be:

```text
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

## Before production

Test these flows on the Vercel Preview URL:

- Google and email sign-in
- Customer/team selection
- Store, cart, budget, and order submission
- Order edit and cancellation
- Admin pages and role checks
- Product image loading/uploads
- PDF, DOCX, and spreadsheet exports
- Push notification subscription and delivery

After the preview passes, merge the migration PR and configure Vercel's Production Branch as `main`.

## Branding note

The original logo was stored only in a Lovable-managed asset path and was not present as a normal file in GitHub. This repository includes a temporary, repository-owned SVG at `public/logikam-logo.svg`. Replace it with the original logo file later if desired, keeping the same public path or updating the references.
