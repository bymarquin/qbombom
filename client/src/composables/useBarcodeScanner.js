import { ref } from 'vue'

// Singleton: compartilhado entre App.vue e PdvView
export const pendingBarcode = ref(null)

const FORM_ROUTES = new Set(['produto-novo', 'produto-editar'])

let barcodeBuffer = ''
let barcodeLastTime = 0

export function initGlobalBarcodeScanner(router) {
  const handler = (e) => {
    const routeName = router.currentRoute.value.name

    // Deixa o formulário de produto tratar por conta própria
    if (FORM_ROUTES.has(routeName)) return

    const now = Date.now()

    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 6 && (now - barcodeLastTime) < 100) {
        e.preventDefault()
        const code = barcodeBuffer
        barcodeBuffer = ''

        if (routeName === 'pdv') {
          // PDV já está aberto — processa direto
          pendingBarcode.value = code
        } else {
          // Outra tela — navega pro PDV e deixa o código pendente
          pendingBarcode.value = code
          router.push('/app/pdv')
        }
        return
      }
      barcodeBuffer = ''
      return
    }

    if (e.key.length === 1) {
      if (now - barcodeLastTime > 100) barcodeBuffer = ''
      barcodeBuffer += e.key
      barcodeLastTime = now
    }
  }

  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
