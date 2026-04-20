const { Product, ProductVariation, ProductImage, AdditionalGroup, AdditionalItem } = require('../models');
const { uploadFile } = require('../services/storageService');

async function extractAndUploadImage(imageBase64) {
  if (!imageBase64) return null;
  const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) return null;
  const contentType = matches[1];
  const ext = contentType.split('/')[1] || 'jpg';
  const buffer = Buffer.from(matches[2], 'base64');
  const key = `products/product_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  return uploadFile(buffer, key, contentType);
}

const imagesInclude = {
  model: ProductImage,
  as: 'images',
  attributes: ['id', 'imageUrl', 'position'],
  order: [['position', 'ASC']],
};

exports.index = async (req, res) => {
  try {
    const whereClause = req.query.all ? {} : { status: true };
    const products = await Product.findAll({
      where: whereClause,
      include: [
        { model: ProductVariation, as: 'variations' },
        imagesInclude,
      ],
      order: [[{ model: ProductImage, as: 'images' }, 'position', 'ASC']],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const itemsWhere = req.query.all ? {} : { status: true };
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductVariation, as: 'variations' },
        imagesInclude,
        {
          model: AdditionalGroup,
          as: 'additionalGroups',
          include: [{ model: AdditionalItem, as: 'items', where: itemsWhere, required: false }],
        },
      ],
      order: [
        [{ model: ProductVariation, as: 'variations' }, 'price', 'ASC'],
        [{ model: ProductImage, as: 'images' }, 'position', 'ASC'],
        [{ model: AdditionalGroup, as: 'additionalGroups' }, 'position', 'ASC'],
        [{ model: AdditionalGroup, as: 'additionalGroups' }, { model: AdditionalItem, as: 'items' }, 'name', 'ASC'],
      ],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Sincroniza o array de imagens para um produto.
// Cada item pode ser: { imageUrl } (novo) ou { id, imageUrl } (existente).
async function syncImages(productId, imagesPayload) {
  if (!Array.isArray(imagesPayload)) return null;

  const existing = await ProductImage.findAll({ where: { productId } });
  const existingMap = new Map(existing.map((img) => [img.id, img]));

  const incomingIds = new Set(
    imagesPayload.filter((img) => img.id).map((img) => img.id),
  );

  // Delete images removed from the list
  for (const img of existing) {
    if (!incomingIds.has(img.id)) {
      await img.destroy();
    }
  }

  // Upsert: upload new, update position of existing
  const results = [];
  for (let i = 0; i < imagesPayload.length; i++) {
    const item = imagesPayload[i];
    if (item.id && existingMap.has(item.id)) {
      await existingMap.get(item.id).update({ position: i });
      results.push(existingMap.get(item.id));
    } else if (item.imageUrl) {
      const created = await ProductImage.create({ productId, imageUrl: item.imageUrl, position: i });
      results.push(created);
    } else if (item.imageBase64) {
      // Compatibilidade com payload legado
      const url = await extractAndUploadImage(item.imageBase64);
      if (url) {
        const created = await ProductImage.create({ productId, imageUrl: url, position: i });
        results.push(created);
      }
    }
  }

  return results.length > 0 ? results[0].imageUrl : null;
}

exports.create = async (req, res) => {
  try {
    const { name, description, status, categoryId, manageStock, stock, images, variations, weightBased, pricePerKg, minPrice, requiresPreparation } = req.body;

    const product = await Product.create({
      name, description, status, categoryId,
      manageStock, stock,
      requiresPreparation: requiresPreparation ?? true,
      weightBased: weightBased ?? false,
      pricePerKg: pricePerKg ?? 0,
      minPrice: minPrice ?? 0,
    });

    const firstImageUrl = await syncImages(product.id, images);
    if (firstImageUrl) await product.update({ imageUrl: firstImageUrl });

    if (Array.isArray(variations) && variations.length > 0) {
      await ProductVariation.bulkCreate(
        variations.map((v) => ({ name: v.name, price: v.price, maxAdditionals: v.maxAdditionals ?? null, productId: product.id })),
      );
    }

    await product.reload({ include: [{ model: ProductVariation, as: 'variations' }, imagesInclude] });
    res.status(201).json(product);
  } catch (error) {
    console.error('[create product]', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { images, variations, basePrice: _ignored, weightBased, pricePerKg, minPrice, ...rest } = req.body;
    if (weightBased !== undefined) rest.weightBased = weightBased;
    if (pricePerKg !== undefined) rest.pricePerKg = pricePerKg;
    if (minPrice !== undefined) rest.minPrice = minPrice;

    // Remove legacy single-image fields from rest to avoid conflicts
    delete rest.imageBase64;

    const firstImageUrl = await syncImages(product.id, images);
    if (firstImageUrl !== null) rest.imageUrl = firstImageUrl;
    else if (Array.isArray(images) && images.length === 0) rest.imageUrl = null;

    await product.update(rest);

    if (Array.isArray(variations)) {
      await ProductVariation.destroy({ where: { productId: product.id } });
      if (variations.length > 0) {
        await ProductVariation.bulkCreate(
          variations.map((v) => ({ name: v.name, price: v.price, maxAdditionals: v.maxAdditionals ?? null, productId: product.id })),
        );
      }
    }

    await product.reload({ include: [{ model: ProductVariation, as: 'variations' }, imagesInclude] });
    res.json(product);
  } catch (error) {
    console.error('[update product]', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: [imagesInclude] });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
