-- Script para limpar todos os pedidos e itens de pedidos
-- Este script limpa APENAS os dados transacionais de vendas, mantendo Clientes, Produtos e Configurações.
-- ATENÇÃO: Esta operação é irreversível.

BEGIN;

-- Desabilita gatilhos temporariamente se necessário (opcional, dependendo do DB)
-- SET session_replication_role = 'replica'; 

-- Limpa os itens dos pedidos primeiro devido à chave estrangeira
DELETE FROM "OrderItems";

-- Limpa os cabeçalhos dos pedidos
DELETE FROM "Orders";

-- Se preferir resetar completamente as tabelas (incluindo contadores se não usar UUID)
-- TRUNCATE TABLE "OrderItems", "Orders" RESTART IDENTITY CASCADE;

COMMIT;

-- Reabilita gatilhos
-- SET session_replication_role = 'origin';

PRINT 'Limpeza de pedidos concluída com sucesso!';
