# Contexto do Projeto: Qbombom (Menu do Cliente)

## 🎯 Objetivo Recente (Concluído)
Aprimorar a experiência do cliente final (Customer Menu), tornando-a "0 atrito" (sem necessidade de criação de conta), com suporte a dark mode nativo, responsividade inteligente entre mobile/desktop, um fluxo de pagamento PIX dinâmico (com QR Code/Copia e Cola padronizado pelo BACEN integrado à tela) e notificações nativas de andamento do pedido no navegador.

## 🛠 Stack Tecnológica Principal
- Vue 3 (Composition API, `<script setup>`)
- TailwindCSS
- Socket.IO (Tempo real)
- Web Notifications API (Push nativo)
- `@vueuse/core` (Dark mode)

## ✅ O que foi feito e validado até agora
1. **Fluxo sem fricção ("Ghost Login"):** Remoção completa de modais de login. O cliente fecha o pedido apenas com Nome/Telefone. Os arquivos de autenticação de clientes foram removidos ou isolados.
2. **Pagamento PIX Dinâmico:** Implementação nativa da geração de PIX (EMV QRCPS) sem depender de APIs pagas. O arquivo `utils/pix.js` gera o payload validado com CRC16, ajustando pontuações de chaves (CNPJ, Celular, etc) para ser aceito em bancos rigorosos (como Itaú e Mercado Pago). O componente `OrderTracking.vue` exibe o QR Code e permite envio do comprovante.
3. **Responsividade de Modais:** As modais (Sacola, Produto, Rastreador, Sucesso) foram ajustadas. No Desktop exibem-se centralizadas com desfoque; no Mobile, deslizam de baixo para cima (`slide-up`) ocupando a tela.
4. **Dark Mode:** Botão de Sol/Lua implementado no cabeçalho do cardápio (`CustomerMenuView.vue`) gerenciado via `useDark`/`useToggle`.
5. **Notificações Push e WebSocket:** 
   - Lógica nativa criada em `utils/notifications.js`.
   - Pedido de permissão ao enviar o carrinho.
   - Escuta de eventos via `socket.on("orderUpdated")` no `CustomerMenuView.vue`.

## 🐛 Último Bug Corrigido (Importante)
Havia um problema onde notificações e toasts do andamento do pedido ("A cozinha começou a preparar", "Saiu para entrega") se repetiam infinitamente a cada atualização de background do pedido via socket.
**Solução Aplicada:** No `CustomerMenuView.vue`, foi adicionada uma trava condicional comparando o status e pagamento novos com os anteriores (`statusMudou` e `pagamentoMudou`). Agora os alertas só disparam se a transição de status for real.

## 📂 Arquivos Principais Alterados/Criados
- `client/src/views/CustomerMenuView.vue`: Layout fluido principal, controle de Dark Mode, tracking de pedidos com Socket.io e disparos de Notification.
- `client/src/components/customer/CartCheckout.vue`: Tela da sacola com Seletor de abas (Local/Levar/Entrega).
- `client/src/components/customer/OrderTracking.vue`: Onde o PIX dinâmico é renderizado e o status do pedido é acompanhado.
- `client/src/utils/pix.js`: Motor de formatação e CRC16 do Banco Central para códigos de Copia e Cola.
- `client/src/utils/notifications.js`: Wrapper seguro para a API de Notificações nativa.

## 🚀 Próximos Passos
[Deixar em aberto para o usuário definir com o Codex o que será criado/refatorado a seguir].
