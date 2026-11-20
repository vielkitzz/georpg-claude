# GeoRPG

Estratégia e RPG geopolítico multiplayer. Interface em português do Brasil.

## Comandos

```bash
npm install
npm run dev          # desenvolvimento
npm run lint         # eslint
npm test             # vitest
npm run typecheck    # tsc
npm run build        # tsc + vite build
npm run build-map    # regenera src/data/gauzoland.json a partir de scripts/data/*Cells*.geojson
```

## Configuração da Fase 1

1. `copy .env.example .env` (PowerShell). Os dois valores são públicos por desenho.
2. Supabase → Auth → Providers → Discord: ativar com Client ID/Secret e escopos `identify guilds.join`.
3. Discord Developer Portal → OAuth2 → Redirects: `https://epglrdsabfsomacyjvey.supabase.co/auth/v1/callback`.
4. Supabase → Auth → URL Configuration: permitir `http://localhost:5173`.
5. Supabase → Edge Functions → Secrets: `DISCORD_BOT_TOKEN` e `DISCORD_GUILD_ID`. O bot precisa da permissão "Criar convite".

Sem as duas variáveis de ambiente, ou sem os dois segredos da função, o acesso fica **bloqueado** (falha fechada).

Banco: `supabase/migrations/` (já aplicada no projeto). Função: `supabase/functions/discord-guild/`.

## Camadas

- `src/domain/`: regras puras (tempo/tick, formatação, política, geometria e viewport do mapa). `time.ts` guarda a escala de tempo em um único lugar (`TIME_SCALE`: 1 dia real = 1 mês de jogo; tick às 8h de Brasília = 11:00 UTC).
- `src/data/`: acesso ao Supabase por meio de `GameRepository`. O repositório de demonstração é usado nos testes.
- `src/ui/` e `src/pages/`: componentes pequenos e telas.
- `scripts/build-map.ts`: gera a geografia (sem dono, nome ou cor) reconstruindo fronteiras pelas arestas compartilhadas e convertendo lon/lat em pixels (1662×780).

## Fundação de nação

O assistente em `/criar-pais` integra o mapa, as instituições e o questionário ideológico em 12 etapas.

- `src/domain/founding/`: opções e combinações válidas (`options.ts`), nome oficial (`name.ts`), semente determinística (`rng.ts`) e gerador de condições iniciais (`generator.ts`).
- `src/domain/ideology/`: `ideology-quiz` (36 afirmações, 12 eixos, 11 arquétipos, bússola, retrato e análise de coerência).
- `/teste-quiz`: página para experimentar o questionário separadamente. O sorteio de respostas exige o papel `ADMIN` no servidor.

### Atualização do Supabase

Em uma janela de implantação autorizada, aplique `20261119225359_founding_preview_and_symbols.sql`, publique a Edge Function `found-nation` e atualize o frontend. A migration cria um bucket privado para PNGs e altera a assinatura da função de confirmação, mantendo os registros existentes. A função usa os mesmos segredos Discord da Fase 1.

Para verificar a transação em uma instância Supabase local com as migrations aplicadas, execute `supabase/tests/founding.sql` via `psql` com `ON_ERROR_STOP=1`. O teste reverte os registros que cria.
