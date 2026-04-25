const { sequelize, Category, Product, ProductVariation, AdditionalGroup, AdditionalItem, ProductAdditionalGroup } = require('../models');
const { Op } = require('sequelize');

exports.exportCatalog = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{
        model: Product,
        as: 'products',
        include: [
          { model: ProductVariation, as: 'variations', order: [['createdAt', 'ASC']] },
          {
            model: AdditionalGroup,
            as: 'additionalGroups',
            through: { attributes: [] },
            include: [{ model: AdditionalItem, as: 'items', order: [['createdAt', 'ASC']] }],
          },
        ],
      }],
      order: [['createdAt', 'ASC']],
    })

    const output = {
      categories: categories.map((cat) => ({
        name: cat.name,
        products: (cat.products || []).map((prod) => ({
          name: prod.name,
          ...(prod.description ? { description: prod.description } : {}),
          ...(prod.weightBased ? { weightBased: true, pricePerKg: prod.pricePerKg, minPrice: prod.minPrice } : {}),
          variations: (prod.variations || []).map((v) => ({
            name: v.name,
            price: parseFloat(v.price),
            ...(v.maxAdditionals != null ? { maxAdditionals: v.maxAdditionals } : {}),
          })),
          additionalGroups: (prod.additionalGroups || []).map((g) => ({
            name: g.name,
            minChoices: g.minChoices,
            maxChoices: g.maxChoices,
            freeChoices: g.freeChoices,
            ...(g.stepperMode ? { stepperMode: true } : {}),
            ...(g.isSaborGroup ? { isSaborGroup: true } : {}),
            items: (g.items || []).map((i) => ({
              name: i.name,
              price: parseFloat(i.price),
            })),
          })),
        })),
      })),
    }

    res.json(output)
  } catch (error) {
    console.error('[exportCatalog]', error)
    res.status(500).json({ error: error.message })
  }
}

exports.deduplicateGroups = async (req, res) => {
  try {
    const removed = []

    await sequelize.transaction(async (t) => {
      const allGroups = await AdditionalGroup.findAll({
        include: [{ model: AdditionalItem, as: 'items' }],
        order: [['createdAt', 'ASC']],
        transaction: t,
      })

      // Agrupar por nome
      const byName = {}
      for (const g of allGroups) {
        if (!byName[g.name]) byName[g.name] = []
        byName[g.name].push(g)
      }

      for (const [name, groups] of Object.entries(byName)) {
        if (groups.length <= 1) continue

        // Manter o que tem mais itens; em empate, o mais antigo (já vem ordenado por createdAt)
        const keeper = groups.reduce((best, g) =>
          g.items.length > best.items.length ? g : best
        , groups[0])

        const duplicates = groups.filter((g) => g.id !== keeper.id)

        for (const dup of duplicates) {
          // Redirecionar vínculos para o keeper (ignorar conflito de PK duplicada)
          const links = await ProductAdditionalGroup.findAll({
            where: { additionalGroupId: dup.id },
            transaction: t,
          })

          for (const link of links) {
            const alreadyLinked = await ProductAdditionalGroup.findOne({
              where: { productId: link.productId, additionalGroupId: keeper.id },
              transaction: t,
            })
            if (!alreadyLinked) {
              await ProductAdditionalGroup.create(
                { productId: link.productId, additionalGroupId: keeper.id },
                { transaction: t }
              )
            }
          }

          await ProductAdditionalGroup.destroy({
            where: { additionalGroupId: dup.id },
            transaction: t,
          })
          await AdditionalItem.destroy({
            where: { additionalGroupId: dup.id },
            transaction: t,
          })
          await dup.destroy({ transaction: t })
          removed.push({ name, removedId: dup.id, keptId: keeper.id })
        }
      }
    })

    res.json({
      message: `${removed.length} grupo(s) duplicado(s) removido(s).`,
      removed,
    })
  } catch (error) {
    console.error('[deduplicateGroups]', error)
    res.status(500).json({ error: error.message })
  }
}

exports.importCatalog = async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: 'JSON inválido. Esperado: { "categories": [...] }' });
  }

  const summary = { categories: 0, products: 0, variations: 0, groups: 0, items: 0 };

  try {
    await sequelize.transaction(async (t) => {
      for (const catData of categories) {
        if (!catData.name) continue;

        const [category] = await Category.findOrCreate({
          where: { name: catData.name },
          defaults: { name: catData.name, status: true },
          transaction: t,
        });
        summary.categories++;

        for (const prodData of (catData.products || [])) {
          if (!prodData.name) continue;

          const product = await Product.create({
            name: prodData.name,
            description: prodData.description || null,
            imageUrl: prodData.imageUrl || null,
            status: true,
            weightBased: prodData.weightBased ?? false,
            pricePerKg: prodData.pricePerKg ?? 0,
            minPrice: prodData.minPrice ?? 0,
            categoryId: category.id,
          }, { transaction: t });
          summary.products++;

          for (const varData of (prodData.variations || [])) {
            if (!varData.name) continue;
            await ProductVariation.create({
              name: varData.name,
              price: varData.price ?? 0,
              maxAdditionals: varData.maxAdditionals ?? null,
              productId: product.id,
            }, { transaction: t });
            summary.variations++;
          }

          for (const [groupIndex, groupData] of (prodData.additionalGroups || []).entries()) {
            if (!groupData.name) continue;

            const [group, created] = await AdditionalGroup.findOrCreate({
              where: { name: groupData.name },
              defaults: {
                minChoices: groupData.minChoices ?? 0,
                maxChoices: groupData.maxChoices ?? 1,
                freeChoices: groupData.freeChoices ?? 0,
                stepperMode: groupData.stepperMode ?? false,
                isSaborGroup: groupData.isSaborGroup ?? false,
                countsTowardLimit: groupData.countsTowardLimit ?? true,
                position: groupIndex,
              },
              transaction: t,
            });
            if (created) summary.groups++;

            await ProductAdditionalGroup.findOrCreate({
              where: { productId: product.id, additionalGroupId: group.id },
              transaction: t,
            });

            if (created) {
              for (const itemData of (groupData.items || [])) {
                if (!itemData.name) continue;
                await AdditionalItem.create({
                  name: itemData.name,
                  price: itemData.price ?? 0,
                  status: true,
                  additionalGroupId: group.id,
                }, { transaction: t });
                summary.items++;
              }
            }
          }
        }
      }
    });

    res.status(201).json({ message: 'Importação concluída com sucesso!', summary });
  } catch (error) {
    console.error('[import]', error);
    res.status(500).json({ error: 'Erro ao importar catálogo.', detail: error.message });
  }
};
