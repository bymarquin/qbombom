const { AdditionalGroup, AdditionalItem, ProductAdditionalGroup } = require('../models');

// ==== GROUPS (globais) ====
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await AdditionalGroup.findAll({
      include: [{ model: AdditionalItem, as: 'items', order: [['price', 'ASC']] }],
      order: [['name', 'ASC']],
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const group = await AdditionalGroup.create({ name, minChoices: 0, maxChoices: 99, freeChoices: 0 });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await AdditionalGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await group.update(req.body);
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
};

exports.destroyGroup = async (req, res) => {
  try {
    const group = await AdditionalGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await group.destroy();
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

// ==== ASSIGN / UNASSIGN ====
exports.assignGroup = async (req, res) => {
  try {
    const { productId } = req.body;
    const { id: additionalGroupId } = req.params;
    await ProductAdditionalGroup.findOrCreate({ where: { productId, additionalGroupId } });
    res.json({ message: 'Group assigned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign group' });
  }
};

exports.unassignGroup = async (req, res) => {
  try {
    const { id: additionalGroupId, productId } = req.params;
    await ProductAdditionalGroup.destroy({ where: { productId, additionalGroupId } });
    res.json({ message: 'Group unassigned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unassign group' });
  }
};

// ==== ITEMS ====
exports.createItem = async (req, res) => {
  try {
    const { name, price, status, additionalGroupId } = req.body;
    const item = await AdditionalItem.create({ name, price, status, additionalGroupId });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await AdditionalItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
};

exports.destroyItem = async (req, res) => {
  try {
    const item = await AdditionalItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
};
