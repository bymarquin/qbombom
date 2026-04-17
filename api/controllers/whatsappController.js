const whatsappService = require('../services/whatsappService')
const { Setting } = require('../models')

const MESSAGES_KEY = 'whatsapp_messages'
const DEFAULT_MESSAGES = {
  em_preparo: '🍧 Seu pedido está sendo preparado! Em breve ficará pronto.',
  pronto: '✅ Seu pedido está pronto! Pode retirar ou aguardar a entrega.',
  finalizado: '🎉 Pedido finalizado. Obrigado pela preferência! Volte sempre 😊',
  cancelado: '❌ Seu pedido foi cancelado. Entre em contato se tiver dúvidas.',
}

exports.getMessages = async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: MESSAGES_KEY } })
    res.json(setting?.value || DEFAULT_MESSAGES)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateMessages = async (req, res) => {
  try {
    const [setting] = await Setting.upsert({ key: MESSAGES_KEY, value: req.body })
    res.json(setting.value)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getStatus = async (req, res) => {
  try {
    const instances = await whatsappService.getInstance()
    const instanceName = process.env.EVOLUTION_INSTANCE || 'qbombom'
    const instance = Array.isArray(instances)
      ? instances.find((i) => i.name === instanceName)
      : null
    res.json({ status: instance?.connectionStatus || 'disconnected', instance })
  } catch (error) {
    res.json({ status: 'disconnected', error: error.message })
  }
}

exports.getQRCode = async (req, res) => {
  try {
    const data = await whatsappService.getQRCode()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createInstance = async (req, res) => {
  try {
    const data = await whatsappService.createInstance()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
