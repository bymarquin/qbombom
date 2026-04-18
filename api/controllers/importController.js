const { sequelize, Category, Product, ProductVariation, AdditionalGroup, AdditionalItem, ProductAdditionalGroup } = require('../models');

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

          for (const groupData of (prodData.additionalGroups || [])) {
            if (!groupData.name) continue;

            const group = await AdditionalGroup.create({
              name: groupData.name,
              minChoices: groupData.minChoices ?? 0,
              maxChoices: groupData.maxChoices ?? 1,
              freeChoices: groupData.freeChoices ?? 0,
            }, { transaction: t });
            summary.groups++;

            await ProductAdditionalGroup.create({
              productId: product.id,
              additionalGroupId: group.id,
            }, { transaction: t });

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
    });

    res.status(201).json({ message: 'Importação concluída com sucesso!', summary });
  } catch (error) {
    console.error('[import]', error);
    res.status(500).json({ error: 'Erro ao importar catálogo.', detail: error.message });
  }
};
