const axios = require('axios')
const { Setting } = require('../models')

const BASE_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const API_KEY = process.env.EVOLUTION_API_KEY || 'qbombom_evolution_key'
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'qbombom'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { apikey: API_KEY },
  timeout: 8000,
})

const DEFAULT_MESSAGES = {
  em_preparo: '🍧 Seu pedido está sendo preparado! Em breve ficará pronto.',
  pronto: '✅ Seu pedido está pronto! Pode retirar ou aguardar a entrega.',
  em_rota: '🛵 Seu pedido saiu para entrega! Acompanhe e confirme o recebimento pelo link abaixo:',
  finalizado: '🎉 Pedido finalizado. Obrigado pela preferência! Volte sempre 😊',
  cancelado: '❌ Seu pedido foi cancelado. Entre em contato se tiver dúvidas.',
}

const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

exports.sendStatusMessage = async (phone, status, orderNumber, trackingUrl = null) => {
  if (!phone) return
  let messages = DEFAULT_MESSAGES
  try {
    const setting = await Setting.findOne({ where: { key: 'whatsapp_messages' } })
    if (setting?.value) messages = { ...DEFAULT_MESSAGES, ...setting.value }
  } catch {}
  const message = messages[status]
  if (!message) return

  let text = `*Qbombom* — Pedido #${orderNumber}\n\n${message}`
  if (trackingUrl) text += `\n${trackingUrl}`

  try {
    await client.post(`/message/sendText/${INSTANCE}`, {
      number: formatPhone(phone),
      text,
    })
  } catch (error) {
    // Falha no WhatsApp não deve derrubar a operação principal
    console.error('[WhatsApp] Erro ao enviar mensagem:', error.message)
  }
}

exports.getInstance = async () => {
  const { data } = await client.get(`/instance/fetchInstances`)
  return data
}

exports.getQRCode = async () => {
  const { data } = await client.get(`/instance/connect/${INSTANCE}`)
  return data
}

exports.createInstance = async () => {
  const { data } = await client.post('/instance/create', {
    instanceName: INSTANCE,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    groupsIgnore: true,
    rejectCall: true,
    msgCall: 'Não atendemos por chamada. Faça seu pedido pelo nosso cardápio!',
  })
  return data
}
