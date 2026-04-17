const { Setting } = require('../models');

// Obter as configurações gerais (Chave única)
exports.getSettings = async (req, res) => {
  try {
    const configKey = 'store_config';
    
    // Tenta encontrar, senão retorna o defaultValue {}
    let setting = await Setting.findOne({ where: { key: configKey } });
    
    if (!setting) {
      setting = await Setting.create({ key: configKey, value: {} });
    }

    res.status(200).json(setting.value);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
};

// Atualizar ou criar configurações
exports.updateSettings = async (req, res) => {
  try {
    const configKey = 'store_config';
    const newConfigData = req.body;

    let setting = await Setting.findOne({ where: { key: configKey } });
    
    if (setting) {
      setting.value = newConfigData;
      await setting.save();
    } else {
      setting = await Setting.create({ key: configKey, value: newConfigData });
    }

    res.status(200).json({ message: 'Configurações atualizadas com sucesso', data: setting.value });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
};
