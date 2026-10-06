# kinoobat

Next.js 16 app. Runtime secrets are delivered by the Infisical CLI instead of a
local `.env` file.

## Prerequisites (once per machine)

1. Install the Infisical CLI — see https://infisical.com/docs/cli/overview
2. Log in: `infisical login` (on a remote/WSL/Codespaces shell without a
   browser, use `infisical login -i`)
3. From this directory, link the codebase to the Infisical project:
   `infisical init` — this writes `.infisical.json`, which holds project
   settings only and contains no secrets.

## Running

```bash
npm run dev     # infisical run --env=dev -- next dev -p 4310
npm run start   # infisical run --env=dev -- next start -p 4310
npm run build   # next build
npm run typecheck
```

The scripts feed secrets into the process environment, so application code keeps
reading `process.env` exactly as before.

`dev:raw` / `start:raw` run the same commands without the Infisical wrapper. They
only work if the variables happen to exist in the shell environment — do not use
them to keep working from a local `.env`.

## Environment variables

| Variable      | Used by                | Notes                                              |
| ------------- | ---------------------- | -------------------------------------------------- |
| `APP_SECRET`  | `src/lib/auth.ts`      | HMAC key for `kn_session` cookies. Set in Infisical. |
| `KINOOBAT_DB` | `src/lib/db.ts`        | Optional SQLite path; defaults to `data/kinoobat.db`. |
| `NODE_ENV`    | Next.js                | Provided by the framework, never by Infisical.      |

Deployments other than local development should use a machine identity with
Universal Auth and pull from the matching environment (`--env=staging`,
`--env=prod`) rather than an interactive login.
