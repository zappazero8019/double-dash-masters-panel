# Double Dash Masters — Painel de Estatísticas

Painel público de estatísticas do canal **Double Dash Masters** (Mario Kart:
Double Dash!!). Aplicação **React + Vite + TypeScript**, bilíngue (pt-BR / en),
tema escuro de e-sports, que consome **somente leitura** a API pública
`mkddtracker-api`.

## Princípios

- **Somente leitura.** O painel nunca envia dados: apenas consulta `GET /stats`.
- **Sem credenciais no frontend.** A API é pública e libera CORS. Não há token,
  chave ou segredo em nenhum lugar do código.
- **Sem dados inventados.** Quando um recurso está vazio ou não é exposto pela
  API, a interface mostra o estado vazio real e explica a limitação — nunca
  preenche com valores fictícios.

## API consumida

Fonte única da URL base: `src/api/config.ts` (`API_BASE_URL`, trocável via
`VITE_API_BASE_URL` em tempo de build).

`GET {API_BASE_URL}/stats?recurso=...` → `{ ok, recurso, dados: [...] }`.

| Recurso        | Uso no painel                                  |
| -------------- | ---------------------------------------------- |
| `geral`        | KPIs da visão geral                            |
| `lives`        | lista de lives finalizadas                     |
| `live`         | detalhe de uma live (`sessao_id`)              |
| `campeonato`   | classificação por vitórias (`ano` opcional)    |
| `jogadores`    | agregados por jogador                          |
| `jogador`      | perfil de um jogador (`player_id`)             |
| `itens`        | contagem de todos os itens                     |
| `relampagos`   | itens da classe relâmpago                      |
| `cascos_azuis` | itens da classe casco azul                     |

### Limitações conhecidas da API

- Não há recurso público de **tempos** (`vw_tempos`).
- A lista de **participantes** de uma live e a **pontuação individual** por
  live não são expostas — apenas o vencedor e seus pontos.
- Essas limitações aparecem de forma explícita ao usuário nas telas
  correspondentes.

## Rotas

| Rota                    | Tela                      |
| ----------------------- | ------------------------- |
| `/`                     | Visão geral               |
| `/jogadores`            | Lista de jogadores        |
| `/jogadores/:playerId`  | Perfil do jogador         |
| `/campeonato`           | Campeonato anual          |
| `/lives`                | Histórico de lives        |
| `/lives/:liveId`        | Detalhe da live           |
| `/itens`                | Estatísticas de itens     |
| `/estatisticas`         | Relâmpagos e cascos azuis |
| `*`                     | Página não encontrada     |

## Scripts

```bash
npm install     # instala as dependências
npm run dev     # servidor de desenvolvimento (http://localhost:5173)
npm run build   # tsc --noEmit + vite build  (saída em dist/)
npm run preview # pré-visualiza o build
npm run lint    # ESLint
```

## Estrutura

```
src/
  api/         cliente HTTP, URL base e adaptadores tipados por recurso
  components/  layout (Sidebar, Topbar, Layout) e blocos de UI reutilizáveis
  hooks/       useRecurso: carregamento, erro, vazio e "atualizado em"
  i18n/        dicionários pt-BR / en e o provedor de idioma
  pages/       uma página por rota
  styles/      tokens de tema e estilos globais
  types/       DTOs da API
  utils/       formatação, ordenação e agregações
```

## Idioma

- Padrão **pt-BR**; a escolha fica salva em `localStorage` (`ddm.idioma`).
- `src/i18n/pt-BR.ts` é a fonte da verdade das chaves; `en.ts` é obrigado em
  tempo de compilação a cobrir todas elas.

## Deploy

O `netlify.toml` já contém o redirecionamento SPA (`/*` → `/index.html`) para
que as rotas do React Router funcionem em produção.

## Acessibilidade

- Navegação por teclado, `:focus-visible` visível e menu mobile fechável com Esc.
- Gráficos possuem alternativa tabular acessível.
- Respeita `prefers-reduced-motion`.
