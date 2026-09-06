# GlobalSend → Neon setup (managed Neon Auth)

The app is fully on Neon: Postgres + Data API (PostgREST), **Neon Managed Better Auth**
(`@neondatabase/neon-js`), and Neon Object Storage (S3). This doc lists the remaining
manual, point-and-click steps in the Neon console and Vercel.

## 1. Data API — use the built-in "Provided by Neon Auth" provider

The Data API authenticates every request with the JWTs that Neon Auth issues, so the
**default** provider selection is correct — keep **"Provided by Neon Auth"**. Do **not**
add a custom provider/JWKS and do not point it at any old `api/auth` URL (that code is
gone).

The roles `anonymous` and `authenticated` already exist and are granted (schema applied).
If the console prompt asks to create roles, skip — they're there.

Verify afterwards (should be 200, not an empty 400):

```
GET https://ep-red-union-ax7ach8h.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1/company_accounts?select=account_name
```

## 2. Neon Auth — trusted origins + auth flow

Auth runs directly against the Neon Auth service on its own domain
(`…neonauth…/neondb/auth`); the session cookie (`__Secure-neonauth.session_token`,
HttpOnly, SameSite=None) is set by that domain, so the app on `globsp.org` sends it
cross-site automatically.

- **Trusted origins** (Neon console → branch → **Settings / Authentication**): add
  `https://globsp.org`. (`allow_localhost` is already true, so local dev works.)
- **Email/password** sign-in + sign-up are enabled out of the box. Email is sent via
  Neon's **shared** provider (fine for development). For production-branded emails,
  set up a custom SMTP/email provider in the auth settings and Vercel's
  `VITE_NEON_AUTH_URL` stays unchanged.
- Password reset uses the **email-link** flow (`requestPasswordReset` →
  `/reset-password?token=…`). No self-hosted code logic, no dev-code shown in the UI.

> Cross-origin caveat: SameSite=None cookies are fine in all modern browsers. In unusual
> cases (locked-down Safari ITP) the cookie may be dropped after idle — signing in again
> restores it. A same-origin proxy of the Neon Auth URL would remove this but is not
> currently configured.

## 3. Object Storage — buckets + credentials

Uploads (avatars, giftcard proofs, parcel images) are presigned PUTs against Neon
S3-compatible Object Storage.

- Credentials + endpoint are already filled into `.env`:
  `NEON_STORAGE_ENDPOINT`, `NEON_STORAGE_REGION=us-east-2`,
  `NEON_STORAGE_ACCESS_KEY_ID`, `NEON_STORAGE_SECRET_ACCESS_KEY`.
- Buckets **`avatars`** and **`proofs`** were already created via the S3 API
  (`node --env-file=.env scripts/create-buckets.mjs`), and a presigned-upload
  round-trip was verified against them.

### ✅ One manual click left: set bucket access level to `public_read`

S3-API ACL/bucket-policy mutations return 501 by design — the access level is only
changeable from the **Neon Console** (Object storage tab → select the bucket → change
Access level to `public_read`) or the Neon API v2. While the buckets are `private`,
`anonymous GET` on an object returns 403, so rendered images in the app will not load.

- Console: **Storage** (or project → branch → **Object storage**) → for **`avatars`**
  and **`proofs`** set **Access level = `public_read`**.
- Alternative: share a `NEON_API_KEY` (Neon console → Account → API keys) and flip it
  via `POST /api/v2/projects/{id}/branches/{id}/buckets/{name}`.

Verify afterwards (should be 200, not 403):

```
GET https://br-calm-breeze-ax8rdsxg.storage.c-4.us-east-2.aws.neon.tech/avatars/<any-object-key>
```

## 4. Vercel — env vars + deploy

Set these in the Vercel project (Settings → Environment Variables), for Production +
Preview:

```
DATABASE_URL                       # from .env (the neondb_owner connection string)
VITE_NEON_DATA_API_URL             # from .env — baked into the client build
VITE_NEON_AUTH_URL                 # from .env — baked into the client build
NEON_APP_ORIGIN                    # https://globsp.org
NEON_STORAGE_ENDPOINT
NEON_STORAGE_REGION
NEON_STORAGE_ACCESS_KEY_ID
NEON_STORAGE_SECRET_ACCESS_KEY
```

- The two `VITE_*` URLs are baked into the SPA at build time and must be set on Vercel
  (Production + Preview) **before** deploying.
- There are **no** `JWT_SECRET`/`JWT_*`/`RESEND_API_KEY` vars anymore — auth and emails
  are handled entirely by Neon Auth.
- Deploy. The `api/` functions compile automatically (`presign` only). The frontend is
  static.

## 5. Autosuspend / wake behavior

- **Compute** tab → set the branch compute timeout as needed (the project is on
  autosuspend; the Data API + pooler wake it on demand).
- Consider enabling/keeping **instant wake** so the first request after idle isn't slow.

## 6. First-run notes

- The Neon database is **fresh**. No users, balances, transactions, parcels or
  notifications were migrated from the Supabase project. Sign up again to create an
  admin (`role = 'admin'` can be set in the SQL editor) and re-seed data in the admin UI.
- Signing up creates the `neon_auth` user AND the matching `profiles` row automatically
  (the app inserts the profile client-side; RLS allows the owner to insert their own row).

## 7. Local development

`/api/*` only runs through the Vercel dev server:

```bash
vercel dev          # serves the SPA (rewrites) AND the api/ functions
```

Plain `vite` will not serve `/api/*`. Re-time the schema anytime with:

```bash
npm run db:migrate   # node --env-file=.env scripts/apply-schema.mjs
```