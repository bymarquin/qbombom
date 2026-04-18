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
    <div id="qr-grid" class="flex-1 overflow-auto">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="n in qtdMesas"
          :key="n"
          class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col items-center gap-3 shadow-sm"
        >
          <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Mesa {{ String(n).padStart(2, '0') }}
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
          <p class="text-xs text-neutral-400 font-mono text-center break-all">
            {{ baseUrl }}?mesa={{ n }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Printer } from 'lucide-vue-next'
import QRCode from 'qrcode'

const qtdMesas = ref(10)
const baseUrl = ref(`${window.location.origin}/cardapio`)
const qrUrls = ref({})

async function gerarQrs() {
  const urls = {}
  for (let n = 1; n <= qtdMesas.value; n++) {
    urls[n] = await QRCode.toDataURL(`${baseUrl.value}?mesa=${n}`, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
  }
  qrUrls.value = urls
}

onMounted(gerarQrs)
watch([qtdMesas, baseUrl], gerarQrs)

function imprimir() {
  const win = window.open('', '_blank')
  if (!win) return

  const cards = Object.entries(qrUrls.value)
    .map(([n, src]) => `
      <div class="card">
        <p class="label">Mesa ${String(n).padStart(2, '0')}</p>
        <img src="${src}" width="160" height="160" />
        <p class="url">${baseUrl.value}?mesa=${n}</p>
      </div>
    `)
    .join('')

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR Codes das Mesas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: white; padding: 16px; }
    .toolbar { display: flex; justify-content: center; margin-bottom: 16px; }
    .btn { background: #dc2626; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn:hover { background: #b91c1c; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; break-inside: avoid; }
    .label { font-size: 14px; font-weight: 700; color: #1f2937; }
    .url { font-size: 9px; color: #9ca3af; font-family: monospace; text-align: center; word-break: break-all; }
    @media print { .toolbar { display: none; } @page { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </div>
  <div class="grid">${cards}</div>
  <script>setTimeout(() => window.print(), 500)<\/script>
</body>
</html>`)
  win.document.close()
}
</script>
