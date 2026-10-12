# Ovel

Ovel is a flat-price booking-to-paid operating platform for small service businesses such as salons, aesthetic clinics, mobile detailers, consultants, and independent specialists. The product plan in `Ovel - SaaS Project Plan & Technical Blueprint.md` describes one commercial loop — quote, book, remind, invoice, and get paid — at a single subscription price, with the business connecting its own payment gateway and Ovel taking no transaction cut.

This repository is the Next.js app for that product. It includes the public marketing site, Clerk sign-in and sign-up, a merchant dashboard, public booking pages, a client portal, interactive quotes, and a super-admin console. Bookings, quotes, invoices, reminders, staff, services, reviews, and booking-page customization are stored in the browser with `localStorage`.

## Stack

- [Next.js 15](https://nextjs.org) App Router and React 19
- TypeScript
- Tailwind CSS 3
- [Clerk](https://clerk.com) (`@clerk/nextjs`) for sign-in, sign-up, session checks, and route protection
- Supabase client helpers in `src/lib/supabase.ts` (`@supabase/supabase-js`). No other module imports them yet.
- Three.js for the background canvas on the marketing page
- Lucide React for icons

`package.json` also depends on `gsap`, `framer-motion`, `howler`, `canvas-confetti`, `clsx`, `tailwind-merge`, and `@supabase/ssr`. The current `src` tree does not import those packages. Click and success sounds are generated in `src/components/AudioController.tsx` with the Web Audio API.

The blueprint also names Stripe Connect, Trigger.dev or Inngest, Resend, the Meta WhatsApp Cloud API, Cloudflare R2, and Google Calendar. Those services are not integrated in this codebase. The WhatsApp route at `src/app/api/webhooks/whatsapp/route.ts` updates local reminder state from a posted reply.

## App routes

| Path | What it does |
| --- | --- |
| `/` | Marketing page |
| `/login`, `/signup` | Clerk sign-in and sign-up when a real publishable key is set |
| `/forgot-password` | Redirects to `/login` |
| `/sso-callback` | Completes a Clerk OAuth redirect |
| `/auth/redirect` | Sends a signed-in user to `/admin` or `/dashboard` |
| `/dashboard` | Merchant home. Also `/roster`, `/users`, `/ovelink`, `/services`, `/staff`, `/invoices`, `/reminders`, `/quotes`, `/reviews`, `/team`, and `/settings` |
| `/admin` | Super-admin console. Requires a signed-in user whose verified email matches `DEVELOPER_SUPER_ADMIN_EMAIL` |
| `/l/[slug]`, `/book/[slug]` | Public booking page for that Ovelink |
| `/quote/[id]` | Interactive quote |
| `/portal/[token]` | Client portal for one booking token |
| `/api/user/me` | Signed-in Clerk profile |
| `/api/webhooks/whatsapp` | Inbound reminder replies (`1` confirms, `2` reschedules) |

`src/middleware.ts` treats the marketing, auth, booking, quote, portal, and webhook paths as public. Other paths require a Clerk user when Clerk is active. Dashboard and admin layouts still call `getWorkspaceProfile()` and redirect when there is no session.

`src/lib/slot-engine.ts` computes open times from working hours, existing bookings, and buffer time. The dashboard screens do not call it yet.

## Setup

```bash
npm install
```

Create `.env.local` in the project root and set the variables below. Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`ClerkProvider` is mounted only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set, does not contain `placeholder`, and starts with `pk_`. The root layout always renders `AuthProvider`, which calls Clerk hooks, so the app needs a real Clerk publishable key and `CLERK_SECRET_KEY`. A verified email equal to `DEVELOPER_SUPER_ADMIN_EMAIL` is given the `super_admin` role and sent to `/admin`.

## Environment variables

These are the variables the application code reads. Do not commit real keys. `.gitignore` ignores `.env*`.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key. Checked in `src/middleware.ts`, `src/components/ClerkProviderWrapper.tsx`, `src/lib/clerk-api.ts`, and the login and signup pages. |
| `CLERK_SECRET_KEY` | Read by `@clerk/nextjs` on the server (`clerkMiddleware`, `auth()`, `currentUser()`). The login and signup pages tell you to set it. |
| `DEVELOPER_SUPER_ADMIN_EMAIL` | Verified Clerk email that `getWorkspaceProfile()` treats as `super_admin`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL in `src/lib/supabase.ts`. If it is unset, that file falls back to a URL baked into the source. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for the browser client in `src/lib/supabase.ts`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Key passed to `getServiceSupabase()`. |
| `NODE_ENV` | `src/middleware.ts` allows 15 seconds of Clerk clock skew when this is `development`, and 5 seconds otherwise. Next.js sets it; you do not need to put it in `.env.local`. |

## Scripts

| Script | Command |
| --- | --- |
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `next lint` |
