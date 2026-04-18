const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse'

exports.reverse = async (req, res) => {
  try {
    const { lat, lon } = req.query

    const latNum = Number(lat)
    const lonNum = Number(lon)

    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return res.status(400).json({ error: 'Parâmetros lat/lon inválidos.' })
    }

    const qs = new URLSearchParams({
      lat: String(latNum),
      lon: String(lonNum),
      format: 'jsonv2',
      addressdetails: '1',
      'accept-language': 'pt-BR',
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${NOMINATIM_BASE_URL}?${qs.toString()}`, {
      headers: {
        'User-Agent': 'Qbombom/1.0 (suporte@qbombomararipe.com.br)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Falha no serviço de geocodificação.',
      })
    }

    const data = await response.json()
    return res.json(data)
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout na geocodificação.' })
    }

    console.error('[geocode.reverse]', error)
    return res.status(500).json({ error: 'Erro interno na geocodificação.' })
  }
}
