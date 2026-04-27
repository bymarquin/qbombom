<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          QR Codes das Mesas
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Gere e imprima os QR Codes para colocar nas mesas.
        </p>
      </div>
      <button
        @click="imprimir"
        class="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        <Printer class="w-4 h-4" />
        Imprimir Todos
      </button>
    </header>

    <!-- Configuração -->
    <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 mb-6 flex flex-wrap items-end gap-4 shrink-0">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quantidade de mesas</label>
        <input
          v-model.number="qtdMesas"
          type="number"
          min="1"
          max="50"
          class="w-28 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">URL base do cardápio</label>
        <input
          v-model="baseUrl"
          type="text"
          class="w-80 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 font-mono"
        />
      </div>
    </div>

    <!-- Grid de QR Codes -->
    <div class="flex-1 overflow-auto">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <!-- Balcão (fixo, sem parâmetro de mesa) -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-red-200 dark:border-red-900 p-4 flex flex-col items-center gap-3 shadow-sm">
          <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">Balcão</p>
          <div class="bg-white p-2 rounded-xl border border-neutral-200">
            <img
              v-if="balcaoQrUrl"
              :src="balcaoQrUrl"
              width="120"
              height="120"
              alt="QR Code Balcão"
            />
            <div v-else class="w-[120px] h-[120px] bg-neutral-100 rounded animate-pulse" />
          </div>
          <button
            @click="imprimirBalcao"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Printer class="w-3 h-3" />
            Imprimir
          </button>
        </div>

        <!-- Mesas -->
        <div
          v-for="n in qtdMesas"
          :key="n"
          class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col items-center gap-3 shadow-sm"
        >
          <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Cardápio
          </p>
          <div class="bg-white p-2 rounded-xl border border-neutral-200">
            <img
              v-if="qrUrls[n]"
              :src="qrUrls[n]"
              width="120"
              height="120"
              :alt="`QR Code Mesa ${n}`"
            />
            <div v-else class="w-[120px] h-[120px] bg-neutral-100 rounded animate-pulse" />
          </div>
          <button
            @click="imprimirMesa(n)"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Printer class="w-3 h-3" />
            Imprimir
          </button>
        </div>
      </div>
    </div>

    <!-- Área de impressão (invisível na tela, visível apenas no print) -->
    <div id="print-area">
      <div v-for="item in printItems" :key="item.label" class="print-card">
        <p class="print-label">{{ item.label }}</p>
        <img :src="item.src" width="200" height="200" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { Printer } from 'lucide-vue-next'
import QRCode from 'qrcode'

const qtdMesas = ref(10)
const baseUrl = ref(`${window.location.origin}/cardapio`)
const qrUrls = ref({})
const balcaoQrUrl = ref('')
const printItems = ref([])

async function gerarQrs() {
  const opts = { width: 120, margin: 1, errorCorrectionLevel: 'M' }
  balcaoQrUrl.value = await QRCode.toDataURL(baseUrl.value, opts)
  const urls = {}
  for (let n = 1; n <= qtdMesas.value; n++) {
    urls[n] = await QRCode.toDataURL(`${baseUrl.value}?mesa=${n}`, opts)
  }
  qrUrls.value = urls
}

onMounted(gerarQrs)
watch([qtdMesas, baseUrl], gerarQrs)

async function disparaImpressao(itens) {
  printItems.value = itens
  await nextTick()
  window.print()
  printItems.value = []
}

function imprimir() {
  const mesaItems = Object.entries(qrUrls.value).map(([n, src]) => ({
    label: 'Cardápio',
    src,
  }))
  disparaImpressao([{ label: 'Balcão', src: balcaoQrUrl.value }, ...mesaItems])
}

function imprimirBalcao() {
  if (balcaoQrUrl.value) disparaImpressao([{ label: 'Balcão', src: balcaoQrUrl.value }])
}

function imprimirMesa(n) {
  const src = qrUrls.value[n]
  if (src) disparaImpressao([{ label: 'Cardápio', src }])
}
</script>

<style>
#print-area {
  display: none;
}

@media print {
  #app {
    visibility: hidden;
  }
  #print-area {
    display: grid !important;
    visibility: visible;
    position: fixed;
    inset: 0;
    background: white;
    padding: 16px;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    align-content: start;
  }
  .print-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    break-inside: avoid;
    background: white;
  }
  .print-label {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    font-family: sans-serif;
  }
  @page { margin: 10mm; }
}
</style>
