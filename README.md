# Logistikam — Vercel edition

This repository is the provider-independent version of Logistikam. It uses TanStack Start, React, Supabase, and Vercel. It does not require the Lovable runtime.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `ItsBoria/logistikam-vercel`.
2. Select the `codex/vercel-independent` branch for the first preview deployment.
3. Keep the detected build command (`npm run build`). Do not set a custom output directory.
4. Add the environment variables below for **Preview** and **Production**.
5. Deploy and use the generated Preview URL for testing.

## Environment variables

Copy the values from the existing Supabase project and push-notification configuration. Never expose the service-role or private VAPID keys with a `VITE_` prefix.

| Variable | Scope | Required |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser | Yes |
| `SUPABASE_URL` | Server | Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Yes |
| `VAPID_PUBLIC_KEY` | Server | For push notifications |
| `VAPID_PRIVATE_KEY` | Server secret | For push notifications |
| `VAPID_SUBJECT` | Server | For push notifications; use `mailto:you@example.com` or an HTTPS URL |

`.env.example` contains the same list for local development.

## Supabase authentication settings

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to the final production domain.
- Add the Vercel production URL to **Redirect URLs**.
- Add the Vercel preview wildcard, for example `https://*-your-vercel-team.vercel.app/**`.

In Supabase Dashboard → Authentication → Providers → Google, keep Google enabled. The application now calls Supabase OAuth directly rather than Lovable authentication.

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
