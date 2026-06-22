# Google OAuth branding for LogistikaM

The text on Google's account chooser is controlled by Google OAuth and the
domain that receives the OAuth callback. It cannot be replaced by application
UI code.

## 1. Google Cloud

Open the Google Cloud project that owns the Google OAuth client used by
Supabase, then configure **Google Auth Platform → Branding**:

- App name: `LogistikaM`
- App logo: the production LogistikaM logo (square PNG, at least 120×120)
- User support email: a monitored support address
- Homepage: the canonical production HTTPS URL
- Privacy policy: a public page on the same authorized domain
- Terms of service: add a public page if applicable
- Authorized domain: the production application domain
- Publishing status: publish the app when the consent screen is complete

Under **Clients**, open the Web application OAuth client and keep these
redirect URIs:

- Production custom auth domain:
  `https://auth.<production-domain>/auth/v1/callback`
- Temporary/default Supabase callback, only while migration is in progress:
  `https://<project-ref>.supabase.co/auth/v1/callback`
- Local Supabase CLI callback, only if local Supabase OAuth is used:
  `http://127.0.0.1:54321/auth/v1/callback`

Remove obsolete callback URLs after production has been verified.

## 2. Supabase

In **Authentication → URL Configuration**:

- Site URL: the canonical production application URL
- Redirect URLs:
  - the canonical production URL with `/**`
  - Vercel preview URLs that are intentionally allowed
  - `http://localhost:3000/**` (or the actual local Vite port)
  - `http://127.0.0.1:3000/**` if used

In **Authentication → Providers → Google**, enter the Google OAuth client ID
and client secret from the same Google Cloud project.

## 3. Branded authentication domain

Google can still show the raw `*.supabase.co` hostname when that hostname is
the OAuth redirect domain. To remove it, create a custom Supabase auth domain,
for example:

`auth.<production-domain>`

This requires Supabase Dashboard access and a Supabase plan that supports
custom domains. Complete the following manually:

1. Add the custom domain in the Supabase project dashboard.
2. Add the DNS record Supabase provides.
3. Wait for certificate provisioning and domain verification.
4. Change production `SUPABASE_URL` and `VITE_SUPABASE_URL` to the branded
   `https://auth.<production-domain>` URL. Keep the same publishable and
   service-role keys.
5. Add `https://auth.<production-domain>/auth/v1/callback` to the Google OAuth
   client's authorized redirect URIs.
6. Verify Google sign-in in production before removing the old Supabase URI.

The server-side `SUPABASE_URL` and browser-side `VITE_SUPABASE_URL` must point
to the same Supabase project/domain. Never expose `SUPABASE_SERVICE_ROLE_KEY`
to the browser.

## 4. Vercel

Set the production and preview environment variables separately:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

After changing any URL, redeploy and test:

1. Production Google login
2. A Vercel preview deployment
3. Local development
4. Sign-out and a fresh sign-in in an incognito window

Google may take a short time to refresh consent-screen branding. The account
chooser should ultimately show `Continue to LogistikaM`; if it still shows the
Supabase hostname, confirm that the active Google client redirects through the
branded custom auth domain rather than the default project domain.
