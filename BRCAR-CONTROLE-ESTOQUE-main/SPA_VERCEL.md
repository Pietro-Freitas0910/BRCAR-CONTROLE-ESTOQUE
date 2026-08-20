# BR Car - versão SPA para Vercel

Esta versão não usa TanStack Start/SSR/Nitro/Lovable server runtime.
É um frontend Vite + React + TanStack Router que acessa o Supabase diretamente via chave publicável e RLS.

Variáveis necessárias na Vercel:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

O arquivo vercel.json redireciona rotas do SPA para index.html.
