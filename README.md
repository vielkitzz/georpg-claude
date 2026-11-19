# GeoRPG (Fase 2, bloco A: domínio da fundação)

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
- `src/data/`: fonte de dados atrás da interface `GameRepository`. Na Fase 0 é a demonstração (nação Teste); na Fase 2 troca-se para o Supabase sem mexer nas páginas.
- `src/ui/` e `src/pages/`: componentes pequenos e telas.
- `scripts/build-map.ts`: gera a geografia (sem dono, nome ou cor) reconstruindo fronteiras pelas arestas compartilhadas e convertendo lon/lat em pixels (1662×780).

## Fase 2, bloco A (checkpoint)

Domínio puro e testado da fundação, sem o assistente ainda:

- `src/domain/founding/`: opções e combinações válidas (`options.ts`), nome oficial (`name.ts`), semente determinística (`rng.ts`) e gerador de condições iniciais (`generator.ts`).
- `src/domain/ideology/`: `ideology-quiz` (36 afirmações, 12 eixos, 11 arquétipos, bússola, retrato e análise de coerência).
- `/teste-quiz`: página **temporária** para experimentar o questionário (será removida no bloco B). O preenchimento aleatório só aparece para `ADMIN`.

## Fora do bloco A

Assistente de 12 etapas, bandeira/brasão com compressão, Edge Function `found-nation`, guarda 2 e dashboard com a nação real.

## Fora da Fase 1

Guarda 2 (sem nação → `/criar-pais`), assistente de fundação, quiz, ordens e tick real.
Os dados do dashboard, governo e mapa ainda são de demonstração. `/criar-pais` é página "em breve".
