# Perfis e Permissões

## Estrutura de Autorização

O sistema utiliza um modelo híbrido:

- **Perfis base (RBAC simplificado)** → para uso rápido na interface
- **Permissões granulares** → para controle fino e escalabilidade

---

## Perfis Base

### SUPER_ADMIN

Perfil técnico (desenvolvedor/suporte)

**Responsabilidades:**

- acesso total ao sistema
- gerenciamento global
- manutenção técnica

---

### MANAGER (Dono/Gerente)

Perfil principal da loja (inclui o dono)

**Responsabilidades:**

- controle total da operação
- gestão de produtos
- gestão de caixa
- acesso a relatórios
- gestão de usuários

---

### CASHIER (Atendente/Caixa)

Perfil operacional de atendimento

**Responsabilidades:**

- criação de pedidos
- edição de carrinho
- registro de pagamentos

---

### PRODUCTION (Cozinha)

Perfil focado na produção

**Responsabilidades:**

- visualizar pedidos
- atualizar status (preparo/pronto)

---

### VIEWER (Opcional)

Perfil de consulta

**Responsabilidades:**

- visualizar relatórios
- acompanhar operação

---

## Permissões Granulares

As permissões são atribuídas aos perfis para controle fino.

### Pedidos

- `orders.create`
- `orders.update`
- `orders.cancel`
- `orders.view`
- `orders.change_status`

---

### Pagamentos

- `payments.create`
- `payments.refund` (opcional)

---

### Caixa

- `cashier.open`
- `cashier.close`
- `cashier.view`

---

### Produtos

- `products.create`
- `products.update`
- `products.toggle_active`

---

### Relatórios

- `reports.view`

---

### Usuários

- `users.create`
- `users.update`
- `users.manage`

---

## Mapeamento Perfil → Permissões

### SUPER_ADMIN

- todas as permissões

---

### MANAGER (Dono)

- todas as permissões operacionais:
  - pedidos (todas)
  - pagamentos (todas)
  - caixa (todas)
  - produtos (todas)
  - relatórios (view)
  - usuários (manage)

---

### CASHIER

- `orders.create`
- `orders.update`
- `orders.view`
- `payments.create`

---

### PRODUCTION

- `orders.view`
- `orders.change_status`

---

### VIEWER

- `orders.view`
- `reports.view`

---

## Observações

- O sistema deve validar permissões no backend (não confiar apenas no frontend)
- Perfis são usados para simplificar UX
- Permissões permitem evolução sem quebrar estrutura
- Possível futuramente permitir customização por usuário

---

## Decisão de Design

- Não existe perfil separado de "Owner"
- O dono utiliza o perfil **MANAGER**
- Isso reduz complexidade e evita duplicação de regras
