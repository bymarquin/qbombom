const whatsappService = require('../services/whatsappService')

exports.getStatus = async (req, res) => {
  try {
    const instances = await whatsappService.getInstance()
    const instance = Array.isArray(instances)
      ? instances.find((i) => i.instance?.instanceName === process.env.EVOLUTION_INSTANCE || 'qbombom')
      : null
    res.json({ status: instance?.instance?.connectionStatus || 'disconnected', instance })
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
