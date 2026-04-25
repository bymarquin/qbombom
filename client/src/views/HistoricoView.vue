<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Histórico de Pedidos
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Pedidos finalizados e cancelados.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por código ou cliente..."
            class="pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
          />
        </div>

        <div class="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm font-medium">
          <button
            v-for="opt in statusOpts"
            :key="opt.value"
            @click="filtroStatus = opt.value"
            :class="[
              'px-3 py-2 transition-colors',
              filtroStatus === opt.value
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <RefreshCw class="w-6 h-6 text-neutral-400 animate-spin" />
    </div>

    <!-- Table -->
    <div v-else class="flex-1 overflow-auto">
      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
              <th class="px-5 py-3 text-left font-semibold">Código</th>
              <th class="px-5 py-3 text-left font-semibold">Cliente</th>
              <th class="px-5 py-3 text-left font-semibold hidden sm:table-cell">Tipo</th>
              <th class="px-5 py-3 text-left font-semibold hidden md:table-cell">Pagamento</th>
              <th class="px-5 py-3 text-right font-semibold">Total</th>
              <th class="px-5 py-3 text-center font-semibold">Status</th>
              <th class="px-5 py-3 text-right font-semibold hidden lg:table-cell">Data</th>
              <th class="px-5 py-3 text-center font-semibold">Info</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginados.length === 0">
              <td colspan="8" class="px-5 py-12 text-center text-neutral-400">
                <div class="flex flex-col items-center gap-2">
                  <History class="w-8 h-8 opacity-50" />
                  Nenhum pedido encontrado.
                </div>
              </td>
            </tr>
            <tr
              v-for="order in paginados"
              :key="order.id"
              class="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td class="px-5 py-3 font-mono font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                #{{ order.trackingCode || order.id.slice(0, 8).toUpperCase() }}
              </td>
              <td class="px-5 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                {{ order.customerName || 'Não informado' }}
              </td>
              <td class="px-5 py-3 text-neutral-500 dark:text-neutral-400 hidden sm:table-cell capitalize">
                {{ order.type }}
              </td>
              <td class="px-5 py-3 text-neutral-500 dark:text-neutral-400 hidden md:table-cell">
                {{ order.paymentMethod || '—' }}
                <span
                  :class="order.paymentStatus === 'pago'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-500 dark:text-orange-400'"
                  class="ml-1 text-xs font-semibold"
                >
                  ({{ order.paymentStatus === 'pago' ? 'Pago' : 'Pendente' }})
                </span>
              </td>
              <td class="px-5 py-3 text-right font-semibold text-neutral-800 dark:text-neutral-200">
                {{ formatarMoeda(order.total) }}
              </td>
              <td class="px-5 py-3 text-center">
                <span
                  :class="order.status === 'finalizado'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
                  class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                >
                  {{ order.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-right text-neutral-400 text-xs hidden lg:table-cell">
                {{ formatarData(order.createdAt) }}
              </td>
              <td class="px-5 py-3 text-center">
                <button
                  @click="abrirDetalhes(order)"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Ver detalhes do pedido"
                >
                  <Info class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div v-if="totalPaginas > 1" class="flex items-center justify-between mt-4 text-sm text-neutral-500">
        <span>{{ filtrados.length }} pedidos · página {{ paginaAtual }} de {{ totalPaginas }}</span>
        <div class="flex gap-2">
          <button
            @click="paginaAtual--"
            :disabled="paginaAtual === 1"
            class="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            @click="paginaAtual++"
            :disabled="paginaAtual === totalPaginas"
            class="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, RefreshCw, History, ChevronLeft, ChevronRight, Info } from 'lucide-vue-next'
import { OrderService } from '@/services/http'
import { formatarMoeda } from '@/utils/formatters'

const POR_PAGINA = 20
const router = useRouter()

const loading = ref(true)
const orders = ref([])
const search = ref('')
const filtroStatus = ref('todos')
const paginaAtual = ref(1)

const statusOpts = [
  { value: 'todos', label: 'Todos' },
  { value: 'finalizado', label: 'Finalizados' },
  { value: 'cancelado', label: 'Cancelados' },
]

const formatarData = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const abrirDetalhes = (order) => {
  router.push({ name: 'pedido-detalhe', params: { id: order.id } })
}

const filtrados = computed(() => {
  let lista = orders.value

  if (filtroStatus.value !== 'todos') {
    lista = lista.filter((o) => o.status === filtroStatus.value)
  }

  const q = search.value.trim().toLowerCase()
  if (q) {
    lista = lista.filter(
      (o) =>
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        o.id.toLowerCase().includes(q),
    )
  }

  return lista
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / POR_PAGINA)))

const paginados = computed(() => {
  const start = (paginaAtual.value - 1) * POR_PAGINA
  return filtrados.value.slice(start, start + POR_PAGINA)
})

watch([search, filtroStatus], () => {
  paginaAtual.value = 1
})

onMounted(async () => {
  try {
    const [finalizados, cancelados] = await Promise.all([
      OrderService.getOrders({ status: 'finalizado' }),
      OrderService.getOrders({ status: 'cancelado' }),
    ])
    orders.value = [...(finalizados.data || []), ...(cancelados.data || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )
  } finally {
    loading.value = false
  }
})
</script>
