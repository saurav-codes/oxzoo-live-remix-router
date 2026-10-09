# remix-router

> **Role in the zoo:** project `remix-router` of [oxzoo-live](https://github.com/saurav-codes/oxzoo-live-control/blob/main/zoo/README.md#projects), deployed with ox on server s2 at https://remix-router.s2.zoo.sorv.dev. The contract it follows is [DESIGN.md](https://github.com/saurav-codes/oxzoo-live-control/blob/main/zoo/DESIGN.md).

React Router 7 in framework mode with server rendering, on s2. It proves the
difference between a build-time variable and a run-time variable on ox:

- `VITE_BUILD_TAG` is read by Vite when `npm run build` runs and baked into the
  client bundle (and the server bundle). The page shows it and `/_zoo/health`
  reports it as `build.tag`.
- `SESSION_SECRET` is read at run time, server-side only, to sign a cookie
  session that counts your visits. There is no default secret: without it the
  page says the session is off.

## What it proves

- Proof level P2.
- The probe's `build-tag` check tells whether ox passed the variable to the
  build: it passes only when the baked tag is non-empty, equals the run-time
  `process.env.VITE_BUILD_TAG`, and appears in a `build/client/assets/*.js` file.
  It fails with `VITE_BUILD_TAG was not set when the build ran` when the build did
  not see it, and with `baked "a" but run time is "b": the build is stale` when
  the value changed without a rebuild (ox's Save & deploy rebuilds).
- The `session` check signs a session with a random value, reads it back from the
  cookie, and checks that a tampered cookie is rejected.

## ox features exercised

- Zero-config detection of React Router: `npm ci`, `npm run build`, start
  `npm run start` (`react-router-serve`, which reads `HOST` and `PORT` and sets
  `NODE_ENV=production`).
- Node pinned by `package.json` `engines.node` (24).
- A build-time variable of yours and a run-time secret of yours.

## Endpoints

| Path | What |
|------|------|
| `GET /` | the build tag, the run-time tag, and the visit counter |
| `GET /_zoo/health` | contract health with `build.tag` and `build.built_at` |
| `GET /_zoo/probe` | `build-tag` and `session` checks |

The zoo endpoints are React Router resource routes (`app/routes.ts`); their
loaders answer the `OPTIONS` preflight too, since React Router sends GET, HEAD and
OPTIONS to the loader.

## Variables

| Name | Source | Role in probe |
|------|--------|---------------|
| `PORT`, `HOST`, `PUBLIC_URL`, `PUBLIC_HOST`, `OX_ENV`, `OX_RELEASE` | provided by ox | none (`PUBLIC_URL` https turns on `Secure` cookies) |
| `SESSION_SECRET` | yours, secret, generate a random value | signs (fp only) |
| `VITE_BUILD_TAG` | yours, plain, for example `zoo-1`, build time | plain |
| `ZOO_PANEL_ORIGIN` | yours, `https://zoo-control.s1.zoo.sorv.dev` | plain |

## Run and test

```sh
npm ci
npm test                 # node:test: zoo-sig vectors, verify reasons, CORS, trace ids, ring, rate limit, probe lock, session round trip and tamper
VITE_BUILD_TAG=zoo-local npm run build
PORT=3000 HOST=127.0.0.1 SESSION_SECRET=... VITE_BUILD_TAG=zoo-local npm run start
```

Local result (2026-10-09): `npm test` 10 of 10 pass; `tsc` clean; the build
puts `"zoo-local"` in `build/client/assets/home-*.js`; the probe is `ok: true` with
matching tags; three requests with a cookie jar count 1, 2, 3; a run-time tag of
`zoo-other` fails `build-tag` as stale; a build without the variable fails it as
not passed to the build; CORS answers only `ZOO_PANEL_ORIGIN`, preflight 204.

## ox check

```console
ox check ~/oxzoo-live/remix-router (manifest: none)

  app.start                  npm run start                                        detected:package.json
  build.install              npm ci                                               detected:package-lock.json
  build.commands[0]          npm run build                                        detected:package.json
  tools.node                 24                                                   detected:package.json

  Provided by ox: PORT, HOST, OX_ENV, OX_PROJECT, OX_RELEASE, OX_DATA_DIR, PUBLIC_URL, PUBLIC_HOST
  Set on the dashboard before the first deploy: SESSION_SECRET, VITE_BUILD_TAG, ZOO_PANEL_ORIGIN

Ready to deploy.
```
