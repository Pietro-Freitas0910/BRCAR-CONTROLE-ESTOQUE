# Otimização de fotos

Alterações aplicadas:

- Fotos novas de veículos são reduzidas no navegador antes do upload (máx. 1600 px no maior lado, WebP quando vantajoso).
- Uploads de fotos passam a usar cache de 1 ano no Supabase Storage.
- Catálogo, estoque e miniaturas usam carregamento preguiçoso (`loading="lazy"`) e decodificação assíncrona.
- A foto principal da ficha do veículo recebe prioridade de carregamento.
- A lógica existente do sistema foi preservada; somente o fluxo/visualização de imagens foi ajustado.

Observação: fotos antigas já salvas no Supabase continuam no tamanho original. O carregamento delas melhora por lazy-loading/cache, mas a maior redução de peso acontece nas fotos enviadas a partir desta versão.
