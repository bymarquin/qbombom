const { Setting } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const configKey = 'store_config';
    const setting = await Setting.findOne({ where: { key: configKey } });
    
    if (!setting || !setting.value || !setting.value.hours) {
      return next(); // Se não tem config, deixa passar
    }

    const maintenance = setting.value.maintenance || {};
    if (maintenance.enabled === true) {
      return res.status(503).json({
        error: maintenance.message || 'Estamos em manutenção no momento. Tente novamente em instantes.',
      });
    }

    const hours = setting.value.hours;

    // 1. Checa a chave mestra (se o dono clicou em "Fechar Loja")
    if (hours.isOpen === false) {
      return res.status(400).json({ error: 'A loja encontra-se fechada no momento.' });
    }

    // 2. Checa o cronograma de horários (se estiver configurado)
    if (hours.schedule && Array.isArray(hours.schedule)) {
      // Ajusta para o horário de Brasília
      const localNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      
      const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
      const currentDayStr = dayMap[localNow.getDay()];
      const dayConfig = hours.schedule.find(d => d.id === currentDayStr);

      if (!dayConfig) return next();

      if (!dayConfig.active) {
        return res.status(400).json({ error: 'A loja não abre neste dia da semana.' });
      }

      const currentHour = localNow.getHours();
      const currentMinute = localNow.getMinutes();
      const currentTotalMinutes = (currentHour * 60) + currentMinute;

      const [openHour, openMin] = dayConfig.open.split(':').map(Number);
      const openTotalMinutes = (openHour * 60) + openMin;

      const [closeHour, closeMin] = dayConfig.close.split(':').map(Number);
      const closeTotalMinutes = (closeHour * 60) + closeMin;

      // Trata casos em que a loja vira a noite (ex: abre 18:00 e fecha 02:00)
      if (closeTotalMinutes < openTotalMinutes) {
        if (currentTotalMinutes > closeTotalMinutes && currentTotalMinutes < openTotalMinutes) {
          return res.status(400).json({ error: `A loja está fechada no momento. Retornaremos às ${dayConfig.open}.` });
        }
      } else {
        // Horário normal (ex: 08:00 às 18:00)
        if (currentTotalMinutes < openTotalMinutes || currentTotalMinutes > closeTotalMinutes) {
          return res.status(400).json({ error: `A loja está fechada. Nosso horário hoje é das ${dayConfig.open} às ${dayConfig.close}.` });
        }
      }
    }

    return next();
  } catch (error) {
    console.error('Erro no middleware checkStoreOpen:', error);
    return next();
  }
};
