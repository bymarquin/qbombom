# Projeto: Sistema de Pedidos e Gestão - Qbombom Araripe (MVP)

## Objetivo

Desenvolver um sistema enxuto e escalável para:
- Gerenciar pedidos (açaí, sorvetes, bebidas, etc.)
- Organizar a linha de produção (KDS simples)
- Registrar vendas e fluxo de caixa
- Gerar relatórios operacionais e financeiros

Foco: **Aumentar ticket médio (upsell de adicionais), reduzir erros operacionais (viagem vs local), combater desperdícios (limites de adicionais) e ter previsibilidade financeira.**

---

## Escopo do MVP

### 1. Gestão de Produtos e Regras de Negócio

Cadastro e manutenção inteligente do cardápio.

**Entidades:**
- **Categoria** (Açaí, Sorvetes, Bebidas, etc.)
- **Produto**
  - Nome
  - Descrição
  - Preço base
  - Status (Ativo/Inativo)
- **Variações (Ex: Tamanho)**
  - Nome (P, M, G, 300ml, 500ml)
  - Preço específico por variação
- **Grupos de Adicionais (Crucial para Açaí)**
  - Nome do Grupo (Ex: "Frutas", "Caldas", "Secos")
  - Regras: Máximo de escolhas, Mínimo de escolhas (obrigatório ou não)
  - Quantidade de itens *Grátis* (Ex: "Até 3 frutas grátis, as demais são cobradas")
  - **Adicionais do Grupo:**
    - Nome
    - Preço extra (se for cobrado)
    - Status (Em estoque/Esgotado)

---

### 2. Fluxo de Pedido e PDV (Frente de Caixa)

#### 2.1 Criação do Pedido
- Tipo de Consumo: **Mesa/Local** ou **Viagem/Retirada**
- Identificação do Cliente (Nome da pessoa ou Número da Ficha/Mesa)
- Seleção de Categoria -> Produto -> Tamanho (Variação)
- Seleção de Adicionais respeitando as regras do "Grupo de Adicionais" (Ex: Bloquear se exceder o máximo permitido)
- Adicionar Observações ao item (Ex: "Sem leite condensado na borda")
- Preço atualizado dinamicamente na tela
- Adicionar item ao Carrinho

#### 2.2 Carrinho de Compras
- Listar itens adicionados
- Alterar quantidade (+ / -)
- Remover itens
- Exibir Subtotal, Descontos (se houver) e Total Geral

#### 2.3 Pagamento e Confirmação
- Definir se o pagamento será feito **Agora** (Balcão) ou **Depois** (Comanda/Mesa)
- Formas de Pagamento: Dinheiro, PIX, Cartão (Crédito/Débito)
- Confirmar pedido:
  - Se PAGO: O pedido vai direto para a Produção.
  - Se PENDENTE (Mesa): O pedido vai para a Produção, mas fica com alerta no caixa para recebimento posterior.

---

### 3. Painel de Produção (KDS - Kitchen Display System)

Tela simples para a equipe que monta os copos/taças.

**Status do pedido na Produção:**
- `PENDENTE` (Aparece na tela)
- `EM_PREPARO` (Atendente clicou que começou a montar)
- `PRONTO` (Pedido finalizado, aguardando retirada)

**Dados exibidos no Card do Pedido:**
- Nome/Número do Cliente e Tipo de Consumo (Mesa ou Viagem - *crucial para saber qual embalagem usar*)
- Itens do pedido detalhados (Com variações, adicionais pagos e grátis)
- Observações destacadas (Ex: "SEM LACTOSE")
- Tempo de espera (Cronômetro desde a criação)

**Ações:**
- Botão "Iniciar Preparo"
- Botão "Marcar como Pronto" (Aciona alerta visual para o caixa/atendente)

---

### 4. Entrega e Finalização

- Pedido marcado como `PRONTO` pela produção aparece na tela de entrega do Caixa.
- Chamada do cliente por Nome/Número.
- Se o status financeiro for `PENDENTE`, obrigar o registro do Pagamento antes da entrega.
- Marcar pedido como `FINALIZADO` (Sai das telas operacionais).

---

### 5. Gestão de Caixa (PDV Financeiro)

Controle rigoroso do dinheiro em gaveta.

**Funções:**
- **Abertura de Caixa:** Registrar o Fundo de Troco inicial (Ex: R$ 50,00).
- **Movimentações Extra (Sangria/Suprimento):**
  - Retirada de dinheiro (Ex: Pagar fornecedor de gelo, Motoboy)
  - Entrada de dinheiro (Ex: Reforço de troco)
- **Fechamento de Caixa:**
  - Resumo esperado pelo sistema (X em Dinheiro, Y em PIX, Z em Cartão).
  - Valor real informado pelo operador cego (para auditoria do gerente).
  - Diferença de quebra de caixa (Sobra ou Falta).

---

### 6. Relatórios e Dashboard (Gestão)

Métricas visuais para tomada de decisão.

- **Vendas:** Faturamento bruto do dia/mês.
- **Ticket Médio:** Valor médio gasto por cliente.
- **Formas de Pagamento:** % de vendas no PIX, Cartão e Dinheiro.
- **Curva ABC de Produtos:** Quais produtos e adicionais mais vendem (para focar em estoque e promoções).
- **Produtividade:** Tempo médio de preparo dos pedidos.

---

### 7. Permissões de Acesso (Segurança)

- **Administrador / Gerente:** Acesso total (Produtos, Relatórios, Fechamento e Ajustes de Caixa, Cancelamento de Pedidos pagos).
- **Operador de Caixa:** Acesso a Criação de Pedidos, Recebimento, Abertura de Caixa (com o seu usuário).
- **Produção:** Acesso exclusivo à tela de Produção (KDS) para não se distrair.

---

## Fluxo Operacional (Happy Path)

```text
1. Abertura do Caixa (Operador informa troco)
2. Chegada do Cliente -> Criação do pedido (Escolhe itens e extras)
3. Confirmação e Pagamento (PIX/Cartão/Dinheiro)
4. Pedido entra no Painel de Produção (KDS) -> EM PREPARO
5. Montagem -> Status PRONTO
6. Entrega ao cliente -> FINALIZADO
7. Fim do expediente -> Fechamento de Caixa -> Relatório Gerado
```