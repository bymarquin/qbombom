const { Product, ProductVariation, AdditionalGroup, AdditionalItem } = require('../models');
const { uploadFile, deleteFile } = require('../services/storageService');

exports.index = async (req, res) => {
  try {
    const whereClause = req.query.all ? {} : { status: true };

    const products = await Product.findAll({
      where: whereClause,
      include: [
        { model: ProductVariation, as: 'variations' }
      ]
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
        {
          model: AdditionalGroup,
          as: 'additionalGroups',
          include: [
            {
              model: AdditionalItem,
              as: 'items',
              where: itemsWhere,
              required: false
            }
          ]
        }
      ],
      order: [
        [{ model: AdditionalGroup, as: 'additionalGroups' }, 'id', 'ASC'],
        [{ model: AdditionalGroup, as: 'additionalGroups' }, { model: AdditionalItem, as: 'items' }, 'price', 'ASC']
      ]
    });
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function extractAndUploadImage(imageBase64) {
  if (!imageBase64) return null;
  const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) return null;
  const contentType = matches[1];
  const ext = contentType.split('/')[1] || 'jpg';
  const buffer = Buffer.from(matches[2], 'base64');
  const key = `products/product_${Date.now()}.${ext}`;
  return uploadFile(buffer, key, contentType);
}

// MÉTODOS CRUD ADMIN
exports.create = async (req, res) => {
  try {
    const { name, description, basePrice, status, categoryId, manageStock, stock, imageBase64 } = req.body;
    const imageUrl = await extractAndUploadImage(imageBase64);
    const product = await Product.create({ name, description, basePrice, status, categoryId, manageStock, stock, imageUrl });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { imageBase64, ...rest } = req.body;

    if (imageBase64) {
      // Remove imagem antiga do R2 se existir
      if (product.imageUrl) {
        const oldKey = product.imageUrl.replace(`${process.env.R2_CDN_URL}/`, '');
        deleteFile(oldKey).catch(() => {});
      }
      rest.imageUrl = await extractAndUploadImage(imageBase64);
    }

    await product.update(rest);
    res.json(product);
  } catch (error) {
    console.error('[update product]', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
