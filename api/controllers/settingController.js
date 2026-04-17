'use strict';

const { Setting } = require('../models');

const STORE_CONFIG_KEY = 'store_config';

exports.getSettings = async (req, res) => {
  try {
    const [setting] = await Setting.findOrCreate({
      where: { key: STORE_CONFIG_KEY },
      defaults: { key: STORE_CONFIG_KEY, value: {} }
    });
    res.json(setting.value);
  } catch (error) {
    console.error('[settings.get]', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const [setting] = await Setting.upsert({ key: STORE_CONFIG_KEY, value: req.body });
    res.json(setting.value);
  } catch (error) {
    console.error('[settings.update]', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
};
