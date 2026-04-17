-- ============================================================
-- Migração: Grupos de Complementos Globais (N:N)
-- Banco: qbombom
-- Rode com: psql -U marquin -d qbombom -f migrate_additional_groups.sql
-- ============================================================

BEGIN;

-- 1. Cria tabela junction ProductAdditionalGroups
CREATE TABLE IF NOT EXISTS "ProductAdditionalGroups" (
  "productId"         UUID NOT NULL REFERENCES "Products"(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "additionalGroupId" UUID NOT NULL REFERENCES "AdditionalGroups"(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("productId", "additionalGroupId")
);

-- 2. Migra os vínculos existentes para a junction table
INSERT INTO "ProductAdditionalGroups" ("productId", "additionalGroupId", "createdAt", "updatedAt")
SELECT "productId", id, NOW(), NOW()
FROM "AdditionalGroups"
WHERE "productId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Remove FK constraint e coluna productId de AdditionalGroups
ALTER TABLE "AdditionalGroups" DROP CONSTRAINT IF EXISTS "AdditionalGroups_productId_fkey";
ALTER TABLE "AdditionalGroups" DROP COLUMN IF EXISTS "productId";

COMMIT;

-- 4. Adiciona coluna maxAdditionals em ProductVariations
ALTER TABLE "ProductVariations" ADD COLUMN IF NOT EXISTS "maxAdditionals" INTEGER;
