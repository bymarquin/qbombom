const { Category, Product, ProductVariation } = require('../models');

exports.index = async (req, res) => {
  try {
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
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
