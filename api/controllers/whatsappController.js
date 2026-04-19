const whatsappService = require('../services/whatsappService')
const { Setting } = require('../models')

const MESSAGES_KEY = 'whatsapp_messages'
const DEFAULT_MESSAGES = {
  em_preparo: '🍧 Seu pedido está sendo preparado! Em breve ficará pronto.',
  pronto: '✅ Seu pedido está pronto! Pode retirar ou aguardar a entrega.',
  em_rota: '🛵 Seu pedido saiu para entrega! Acompanhe e confirme o recebimento pelo link abaixo:',
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
  const data = await whatsappService.getConnectionStatus()
  res.json(data)
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

exports.disconnectInstance = async (req, res) => {
  try {
    const data = await whatsappService.disconnectInstance()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

exports.reconnectInstance = async (req, res) => {
  try {
    const data = await whatsappService.reconnectInstance()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
