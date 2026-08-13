# Vercel runtime fix

The custom `src/start.ts` bootstrap was removed because its direct calls to
`createCsrfMiddleware` / `createMiddleware` produced HTTP 500 errors in the Vercel
server runtime. TanStack Start now uses its default bootstrap.

The TanStack packages are pinned to the same version (`1.168.32`) to avoid
cross-version runtime API mismatches during `npm install` on Vercel.

Node is pinned to 22.x via `package.json` for consistent server builds.
