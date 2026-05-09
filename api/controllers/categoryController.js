const { Category, Product, ProductVariation } = require('../models');
const cache = require('../utils/simpleCache');

const CATALOG_CACHE_TTL_MS = Number(process.env.CATALOG_CACHE_TTL_MS || 15000);

exports.index = async (req, res) => {
  try {
    const cacheKey = req.query.all ? 'categories:all' : 'categories:public';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const categoryWhere = req.query.all ? {} : { status: true };
    const productWhere = req.query.all ? {} : { status: true };

    const categories = await Category.findAll({
      where: categoryWhere,
      include: [
        {
          model: Product,
          as: 'products',
          where: productWhere,
          required: false,
          include: [
            {
              model: ProductVariation,
              as: 'variations',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ],
      order: [
        ['position', 'ASC'],
        [{ model: Product, as: 'products' }, 'id', 'ASC'],
        [{ model: Product, as: 'products' }, { model: ProductVariation, as: 'variations' }, 'price', 'ASC']
      ]
    });
    await cache.set(cacheKey, categories, CATALOG_CACHE_TTL_MS);
    res.json(categories);
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          include: ['variations']
        }
      ]
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// MÉTODOS CRUD ADMIN:
exports.create = async (req, res) => {
  try {
    const { name, status } = req.body;
    const last = await Category.max('position');
    const position = (last || 0) + 1;
    const category = await Category.create({ name, status, position });
    await cache.delByPrefix('categories:');
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    
    const { name, status, position } = req.body;
    await category.update({ name, status, ...(position !== undefined && { position }) });
    await cache.delByPrefix('categories:');
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    
    // Deleta os produtos vinculados via Cascade (se configurado) ou avisa
    await category.destroy();
    await cache.delByPrefix('categories:');
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
