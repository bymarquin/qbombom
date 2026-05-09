'use strict';

const { Setting } = require('../models');
const cache = require('../utils/simpleCache');

const STORE_CONFIG_KEY = 'store_config';
const SETTINGS_CACHE_KEY = 'settings:store_config';
const SETTINGS_CACHE_TTL_MS = Number(process.env.SETTINGS_CACHE_TTL_MS || 10000);

exports.getSettings = async (req, res) => {
  try {
    const cached = await cache.get(SETTINGS_CACHE_KEY);
    if (cached) return res.json(cached);

    const [setting] = await Setting.findOrCreate({
      where: { key: STORE_CONFIG_KEY },
      defaults: { key: STORE_CONFIG_KEY, value: {} }
    });
    await cache.set(SETTINGS_CACHE_KEY, setting.value || {}, SETTINGS_CACHE_TTL_MS);
    res.json(setting.value);
  } catch (error) {
    console.error('[settings.get]', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const [setting] = await Setting.upsert({ key: STORE_CONFIG_KEY, value: req.body });
    await cache.del(SETTINGS_CACHE_KEY);
    res.json(setting.value);
  } catch (error) {
    console.error('[settings.update]', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
};
