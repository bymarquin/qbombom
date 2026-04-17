# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Visão Geral do Projeto

Qbombom é um sistema full-stack de PDV + gestão de pedidos para uma açaiteria/sorveteria. Cobre: cardápio público (ghost login, pagamento via PIX), ponto de venda (PDV), display de cozinha (KDS), rastreamento de delivery e painel administrativo.

## Comandos

### API (`/api`)
```bash
npm run dev        # Servidor de desenvolvimento com nodemon
npm run start      # Servidor de produção
```

### Client (`/client`)
```bash
npm run dev        # Servidor Vite com HMR
npm run build      # Build de produção
npm run preview    # Pré-visualização do build de produção
npm run lint       # Executa oxlint + ESLint
npm run format     # Formatador Oxfmt
```

### Banco de Dados
O Sequelize CLI gerencia as migrations. Config em `api/config/config.json`. Bancos: `qbombom` (dev), `qbombom_test` (test), `qbombom_production` (prod).

### Variáveis de Ambiente
- Copiar `api/.env.example` → `api/.env` (DATABASE_URL, JWT_SECRET, config SMTP)
- Copiar `client/.env.example` → `client/.env` (VITE_API_URL, VITE_SOCKET_URL)
- Requer Node 20.19+ ou 22.12+ (lado do client)

## Arquitetura

### Backend (`/api`)

**Ponto de entrada:** `app.js` — servidor Express 5.x + Socket.IO.

**Padrão Rota → Controller** em `/routes` e `/controllers`:
- `/auth` — login/logout/refresh JWT, ghost login de cliente, login por PIN
- `/orders` — CRUD de pedidos, transições de status, criação pública de pedidos
- `/products` — Catálogo com variações e grupos/itens de adicionais
- `/dashboard` — Métricas de negócio: vendas, ticket médio, formas de pagamento, curva ABC

**Cadeia de middlewares:** `auth.js` (verificação JWT) → `checkPermission.js` (permissão granular) → `checkStoreOpen.js` (bloqueio por horário de funcionamento).

**Models** usam Sequelize com PKs UUID. Associações principais: `Product → ProductVariation`, `Product → AdditionalGroup → AdditionalItem`, `Order → OrderItem`.

### Frontend (`/client/src`)

**Estado:** Pinia store em `/stores/` (atualmente apenas `toast.js`).

**Services:** Todas as chamadas à API passam por `/services/http.js` — uma instância Axios com interceptors de refresh JWT, mais objetos de serviço nomeados (`AuthService`, `CatalogService`, `OrderService`, etc.) e cliente Socket.IO em `/services/socket.js`.

**Router** (`/router/index.js`) dividido em:
- Público: `/cardapio` (CustomerMenuView — sem autenticação)
- Auth: `/auth/*`
- Protegido `/app/*`: views de CRUD administrativo (dashboard, categorias, produtos, pedidos, usuários)
- Por perfil: `/pdv` (CASHIER), `/kds` (PRODUCTION), `/delivery` (DELIVERY)

**Organização de componentes:** `components/customer/` para o fluxo do cardápio público, `components/kds/` para cards da cozinha, `components/layout/` para sidebar e alternador de tema.

### Fluxo em Tempo Real

Socket.IO emite eventos `orderUpdated` quando o status de um pedido muda. As views KDS e Delivery escutam via socket service e disparam alertas via Web Notifications API + toast. O client faz subscribe em `onMounted` e unsubscribe em `onUnmounted`.

### Máquina de Status do Pedido

`novo → em_preparo → pronto → finalizado`

As transições de status são responsabilidade das views por perfil: KDS avança para `em_preparo`/`pronto`; PDV/caixa finaliza.

### Autenticação e Perfis

Access token JWT (curta duração) + refresh token (longa duração). Respostas 401 disparam refresh silencioso no interceptor do Axios. Perfis: `SUPER_ADMIN`, `MANAGER`, `CASHIER`, `PRODUCTION`, `VIEWER`. O mapeamento perfil→rota é aplicado no router; o backend aplica permissões granulares definidas em `Perfis.md`.

### Pagamentos PIX

`/client/src/utils/pix.js` gera QR Codes PIX dinâmicos no formato EMV QRCPS com validação CRC16 — sem dependência de serviço externo.
