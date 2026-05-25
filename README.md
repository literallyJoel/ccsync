# CCSync

CCSync is a work-in-progress app for keeping credit card spending aligned with
Monzo pots.

The goal is to let a user connect a Monzo account, connect a credit card account
through TrueLayer, choose a Monzo pot, and then automatically move money from
the selected Monzo current account into that pot whenever new credit card
transactions appear.

## How it works

1. A user signs in with Clerk.
2. The user connects Monzo through OAuth.
3. The user connects a credit card provider through TrueLayer.
4. Refresh tokens are stored in Doppler under user-specific secret keys.
5. The backend can fetch Monzo accounts and pots, fetch TrueLayer account
   transactions, and move money into or out of Monzo pots.
6. A cron-based sync process will use those pieces to match new card spending
   and move the equivalent amount into the configured pot.

## Apps

This repo is a Bun workspace managed with Turbo.

- `apps/web` - React 19 and Vite frontend. It currently handles Clerk sign-in
  and sign-out.
- `apps/backend` - Bun HTTP server. It serves the frontend in development,
  exposes API routes under `/api`, and contains the Monzo, TrueLayer, Doppler,
  and shared API client code.

## Tech stack

- Bun
- Turbo
- React
- Vite
- Clerk
- Monzo API
- TrueLayer Data API
- Doppler
- TypeScript
- Zod
- Axios

## Getting started

Install dependencies:

```sh
bun install
```

Start the full workspace in development mode:

```sh
bun run dev
```

The backend listens on port `8080` and serves the frontend from the same Bun
server in development.

You can also run individual workspace scripts:

```sh
bun run --filter @ccsync/backend dev
bun run --filter @ccsync/web dev
```

## Environment variables

The backend validates its environment on startup. The following variables are
required:

```sh
MONZO_CLIENT_ID=
MONZO_CLIENT_SECRET=
MONZO_REDIRECT_URI=

TRUELAYER_CLIENT_ID=
TRUELAYER_CLIENT_SECRET=
TRUELAYER_REDIRECT_URI=

CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

DOPPLER_TOKEN=
DOPPLER_PROJECT=
DOPPLER_CONFIG=

NODE_ENV=development
```

`NODE_ENV` can be `development`, `production`, or `test`; it defaults to
`development`.

## API routes

Routes are generated from `apps/backend/src/routes` and are mounted under
`/api`.

Current routes include:

- `GET /api/monzo/auth/callback` - completes Monzo OAuth and stores the refresh
  token in Doppler.
- `GET /api/monzo/accounts` - returns connected Monzo accounts for the signed-in
  user.
- `PUT /api/monzo/pots/deposit` - deposits an amount into a Monzo pot.
- `PUT /api/monzo/pots/withdraw` - withdraws an amount from a Monzo pot.
- `GET /api/truelayer/auth/callback` - completes TrueLayer OAuth and stores the
  refresh token in Doppler.
- `GET /api/truelayer/accounts` - returns connected TrueLayer accounts for the
  signed-in user.
- `GET /api/truelayer/transactions` - returns pending, settled, or all
  transactions for a connected TrueLayer account.

Authenticated routes use Clerk session data. Provider refresh tokens are looked
up from Doppler using keys based on the Clerk user id.

## Useful scripts

From the repo root:

```sh
bun run dev
bun run build
bun run typecheck
bun run lint
```

`lint` currently maps to TypeScript checking in each app.

## Current status

The project currently has the main provider clients and route skeleton in
place, but the end-to-end product flow is still being built. The frontend only
contains the basic Clerk authentication UI, and the automatic transaction sync
job is not wired up yet.

## Todo

- Build the UI for connecting Monzo and TrueLayer accounts.
- Let users choose the source Monzo account, target pot, and credit card account
  to sync.
- Implement the cron job for transaction syncing.
- Store sync configuration per user.
- Track which transactions have already been processed so repeated syncs are
  idempotent.
- Handle failed transactions and refunds by moving money back from pots to the
  main account.
- Improve error screens for OAuth callback failures.
- Add tests around provider clients, route validation, and sync behaviour.
