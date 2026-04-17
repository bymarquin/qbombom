# Qbombom

Sistema completo de gestão de pedidos e ponto de venda para açaiteria/sorveteria. Cobre cardápio público, PDV, cozinha (KDS), delivery e painel administrativo.

## Tecnologias

**Backend:** Node.js + Express 5, Sequelize ORM, PostgreSQL, Socket.IO, JWT  
**Frontend:** Vue 3 (Composition API), Vite, TailwindCSS 4, Pinia  
**Storage:** Cloudflare R2 (imagens de produtos e comprovantes PIX)

## Funcionalidades

- **Cardápio público** — cliente monta o pedido sem criar conta (ghost login por telefone), paga via PIX dinâmico ou dinheiro/cartão
- **PDV** — caixa cria pedidos, gerencia pagamentos e finaliza atendimento
- **KDS (Cozinha)** — produção acompanha pedidos em tempo real, avança status via Socket.IO
- **Delivery** — acompanhamento de pedidos prontos para entrega
- **Admin** — CRUD de produtos (com upload de imagem + crop), categorias, complementos, usuários e configurações
- **Dashboard** — métricas de vendas, ticket médio, formas de pagamento, curva ABC

## Estrutura

```
qbombom/
├── api/        # Backend Node.js/Express
└── client/     # Frontend Vue 3
```

## Instalação

### Pré-requisitos
- Node.js 20.19+ ou 22.12+
- PostgreSQL

### Backend

```bash
cd api
npm install
cp .env.example .env   # preencher variáveis
npx sequelize-cli db:migrate
npm run dev
```

### Frontend

```bash
cd client
npm install
cp .env.example .env   # preencher VITE_API_URL e VITE_SOCKET_URL
npm run dev
```

## Variáveis de Ambiente

### `api/.env`

```env
DATABASE_URL=
JWT_SECRET=
API_URL=

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=true
SMTP_FROM=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_CDN_URL=
```

### `client/.env`

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## Perfis de Acesso

| Perfil | Acesso |
|--------|--------|
| `SUPER_ADMIN` | Tudo |
| `MANAGER` | Admin completo exceto usuários root |
| `CASHIER` | PDV + pedidos |
| `PRODUCTION` | KDS |
| `VIEWER` | Somente leitura |
