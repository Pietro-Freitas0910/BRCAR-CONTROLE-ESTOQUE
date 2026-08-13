# Vercel fix

This version removes the Lovable-specific Vite wrapper and uses the standard TanStack Start + Nitro Vercel configuration.

Main changes:
- `@lovable.dev/vite-tanstack-config` removed.
- Standard `tanstackStart()` Vite plugin enabled.
- Nitro Vite plugin configured with the `vercel` preset.
- Custom `src/server.ts` removed so TanStack Start uses its default server entry.
- Lovable Cloud Auth and Lovable runtime error-reporting code removed.
- Node.js fixed to 22.x.

The Supabase client and existing application routes/data logic are unchanged.
