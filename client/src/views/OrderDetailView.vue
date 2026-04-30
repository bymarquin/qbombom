<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex items-center justify-between mb-6 shrink-0">
      <div>
        <button
          type="button"
          @click="voltar"
          class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-1 inline-flex items-center gap-1"
        >
          <ChevronLeft class="w-4 h-4" /> Voltar
        </button>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Pedido #{{ order?.trackingCode || route.params.id.slice(0, 8) }}
        </h1>
      </div>
    </header>

    <div
      v-if="loading"
      class="flex-1 flex items-center justify-center"
    >
      <div class="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="order" class="flex-1 overflow-y-auto flex flex-col gap-6">
      <!-- Receber pagamento pendente (Pagar Depois) -->
      <div
        v-if="order.paymentMethod === 'Pagar Depois' && order.paymentStatus !== 'pago'"
        class="p-4 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10"
      >
        <p class="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3">Pagamento pendente — R$ {{ parseFloat(order.total).toFixed(2) }}</p>
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="metodo in ['PIX', 'Crédito', 'Débito', 'Dinheiro']"
            :key="metodo"
            @click="metodoPagamentoReceber = metodo"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            :class="metodoPagamentoReceber === metodo
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-900 text-amber-800 dark:text-amber-300 hover:bg-amber-50'"
          >
            {{ metodo }}
          </button>
        </div>
        <button
          @click="receberPagamento"
          class="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
        >
          Confirmar Recebimento
        </button>
      </div>

      <!-- Confirmação PIX pendente -->
      <div
        v-if="order.paymentMethod === 'PIX' && order.paymentStatus !== 'pago'"
        class="p-4 rounded-xl flex items-center justify-between gap-4"
        :class="'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/40'"
      >
        <div>
          <p class="text-sm font-bold"
            :class="'text-orange-800 dark:text-orange-300'"
          >
            Aguardando pagamento PIX
          </p>
          <p class="text-xs"
            :class="'text-orange-700 dark:text-orange-400'"
          >
            A confirmação acontece automaticamente pelo Gateway PIX.
          </p>
        </div>
      </div>

      <!-- Info Grid -->
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-6"
      >
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Cliente</p>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {{ order.customerName || 'Não informado' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Telefone</p>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {{ order.customerPhone || 'Não informado' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Tipo</p>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{{ order.type }}</p>
          </div>
          <div>
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Pagamento</p>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
              {{ order.paymentStatus }} ({{ order.paymentMethod }})
            </p>
          </div>
          <div v-if="order.eta?.inQueue">
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Previsão de preparo</p>
            <p class="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              {{ formatEta(order.eta.etaMinutes) }} (fila #{{ order.eta.queuePosition }})
            </p>
          </div>
          <div v-if="order.type === 'Entrega'" class="col-span-2">
            <p class="text-xs text-neutral-500 dark:text-neutral-500 font-medium">Endereço de Entrega</p>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {{ order.deliveryAddress || 'Não informado' }}
            </p>
            <!-- Coordinates and navigation links -->
            <template v-if="order.deliveryLatitude != null && order.deliveryLongitude != null">
              <p class="text-xs text-neutral-400 dark:text-neutral-600 mt-1 font-mono">
                {{ Number(order.deliveryLatitude).toFixed(6) }}, {{ Number(order.deliveryLongitude).toFixed(6) }}
                <span v-if="order.deliveryAccuracyMeters != null" class="ml-1">(±{{ Math.round(order.deliveryAccuracyMeters) }}m)</span>
              </p>
              <div class="flex gap-2 mt-2 flex-wrap">
                <a
                  :href="`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Navigation class="w-3.5 h-3.5" /> Google Maps
                </a>
                <a
                  :href="`https://waze.com/ul?ll=${order.deliveryLatitude},${order.deliveryLongitude}&navigate=yes`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors"
                >
                  <Navigation class="w-3.5 h-3.5" /> Waze
                </a>
              </div>
            </template>
          </div>
        </div>

        <div
          v-if="order.observation"
          class="bg-orange-50 p-3 rounded-lg border border-orange-100"
        >
          <p class="text-xs text-orange-800 font-medium mb-1">Observação do Pedido:</p>
          <p class="text-sm text-orange-900">{{ order.observation }}</p>
        </div>
      </div>

      <!-- Items -->
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-6"
      >
        <h4 class="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-100 dark:border-neutral-800/50 pb-2">
          Itens
        </h4>

        <ul class="space-y-3 mb-4">
          <li
            v-for="item in order.items"
            :key="item.id"
            class="flex justify-between items-start text-sm"
          >
            <div class="flex-1">
              <span class="font-medium text-neutral-900 dark:text-neutral-100">
                {{ item.quantity }}x {{ item.product?.name || 'Produto' }}
                <span v-if="item.variation?.name || item.variationName" class="text-red-600 font-semibold">
                  • {{ item.variation?.name || item.variationName }}
                </span>
              </span>
              <p
                v-if="item.observation"
                class="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5"
              >Obs: {{ item.observation }}</p>
              <div
                v-if="item.selectedAdditionals && item.selectedAdditionals.length > 0"
                class="mt-1 text-xs text-neutral-500 dark:text-neutral-500 space-y-1"
              >
                <template v-for="group in groupAdditionals(item.selectedAdditionals)" :key="group.name">
                  <p v-if="group.name" class="font-medium text-neutral-600 dark:text-neutral-400 mt-1">{{ group.name }}:</p>
                  <p v-for="add in group.items" :key="add.id ?? add.name" class="pl-1">
                    {{ add.name }}<span v-if="add.price > 0" class="text-neutral-400"> +{{ formatMoney(add.price) }}</span>
                  </p>
                </template>
              </div>
            </div>
            <span class="font-medium text-neutral-900 dark:text-neutral-100 ml-4">
              {{ formatMoney(item.totalPrice) }}
            </span>
          </li>
        </ul>

        <div class="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
          <span class="font-medium text-neutral-500 dark:text-neutral-500">Total</span>
          <span class="text-lg font-bold text-red-600">{{ formatMoney(order.total) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-6 flex flex-col gap-3"
      >
        <button
          @click="printOrder"
          class="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all"
        >
          <Printer class="w-5 h-5" />
          Imprimir Comanda
        </button>

        <template v-if="userRole === 'SUPER_ADMIN' || userRole === 'MANAGER'">
          <label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mt-2">
            Alterar Status do Pedido:
          </label>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button
              v-for="s in statusOptions"
              :key="s.value"
              @click="updateStatus(s.value)"
              :class="
                order.status === s.value
                  ? s.activeClass
                  : 'bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              "
              class="px-2 py-2 rounded-lg text-xs font-medium transition-all shadow-sm dark:shadow-none"
            >
              {{ s.label }}
            </button>
          </div>
        </template>

        <template v-else-if="userRole === 'CASHIER'">
          <label class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mt-2">
            Ações:
          </label>
          <button
            @click="cancelOrder"
            :disabled="['cancelado', 'finalizado', 'entregue'].includes(order.status)"
            class="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            :class="
              order.status === 'cancelado'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40'
            "
          >
            {{ order.status === 'cancelado' ? 'Pedido Cancelado' : 'Cancelar Pedido' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Navigation, Printer } from 'lucide-vue-next'
import { OrderService, AuthService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useOrderStatus } from '@/composables/useOrderStatus'
import { useOrderSocket } from '@/composables/useOrderSocket'
import { printReceipt } from '@/utils/printReceipt'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const { statusLabel } = useOrderStatus()
const userRole = AuthService.getRole()

const order = ref(null)
const loading = ref(true)
const metodoPagamentoReceber = ref('PIX')

const voltar = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/app/pedidos')
}

const statusOptions = computed(() => {
  const options = [
    { value: 'novo', label: 'Novo', activeClass: 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-600/30' },
    { value: 'em_preparo', label: 'Preparo', activeClass: 'bg-yellow-500 text-white ring-2 ring-offset-2 ring-yellow-500/30' },
    { value: 'pronto', label: 'Pronto', activeClass: 'bg-emerald-600 text-white ring-2 ring-offset-2 ring-emerald-600/30' },
  ]

  if (order.value?.type === 'Entrega') {
    options.push({ value: 'em_rota', label: 'Em Rota', activeClass: 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-600/30' })
    options.push({ value: 'entregue', label: 'Finalizado', activeClass: 'bg-neutral-800 text-white ring-2 ring-offset-2 ring-neutral-800/30' })
  } else {
    options.push({ value: 'finalizado', label: 'Finalizado', activeClass: 'bg-neutral-800 text-white ring-2 ring-offset-2 ring-neutral-800/30' })
  }

  options.push({ value: 'cancelado', label: 'Cancelar', activeClass: 'bg-red-600 text-white ring-2 ring-offset-2 ring-red-600/30' })
  return options
})

const loadOrder = async () => {
  loading.value = true
  try {
    const res = await OrderService.getOrder(route.params.id)
    order.value = res.data
  } catch (error) {
    toast.error('Erro ao carregar pedido')
    console.error(error)
    router.push('/app/pedidos')
  } finally {
    loading.value = false
  }
}

function onOrderUpdated(updated) {
  if (!order.value) return
  if (order.value.id !== updated.id && order.value.trackingCode !== updated.trackingCode) return
  Object.assign(order.value, updated)
}

onMounted(loadOrder)

useOrderSocket({
  onUpdated: onOrderUpdated,
})

const updateStatus = async (newStatus) => {
  if (!order.value || order.value.status === newStatus) return
  if (newStatus === 'cancelado') { cancelOrder(); return }
  try {
    await OrderService.updateOrderStatus(order.value.id, newStatus)
    order.value.status = newStatus
    toast.success(`Status atualizado para: ${statusLabel(newStatus)}`)
  } catch (error) {
    toast.error('Erro ao atualizar status')
    console.error(error)
  }
}

const receberPagamento = async () => {
  if (!order.value) return
  try {
    await OrderService.updateOrderStatus(order.value.id, null, 'pago', metodoPagamentoReceber.value)
    order.value.paymentStatus = 'pago'
    order.value.paymentMethod = metodoPagamentoReceber.value
    toast.success(`Pagamento de R$ ${parseFloat(order.value.total).toFixed(2)} confirmado via ${metodoPagamentoReceber.value}.`)
  } catch {
    toast.error('Erro ao confirmar pagamento')
  }
}

const cancelOrder = async () => {
  if (!order.value || order.value.status === 'cancelado') return
  try {
    await OrderService.cancelOrder(order.value.id)
    order.value.status = 'cancelado'
    toast.success(`Pedido #${order.value.trackingCode || order.value.id.slice(0, 8)} cancelado.`)
  } catch (error) {
    toast.error('Erro ao cancelar pedido')
    console.error(error)
  }
}

const printOrder = async () => {
  if (!order.value) return
  try {
    await printReceipt(order.value)
  } catch {
    toast.error('Não foi possível abrir o diálogo de impressão.')
    return
  }
  if (order.value.status === 'novo') {
    await updateStatus('em_preparo')
  }
}

const formatMoney = (val) =>
  Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const groupAdditionals = (additionals) => {
  if (!additionals?.length) return []
  const map = new Map()
  for (const add of additionals) {
    const key = add.groupName || add.grupoName || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(add)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
}

const formatEta = (minutes) => {
  const value = Math.max(Number(minutes) || 0, 0)
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const remaining = value % 60
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}min`
}
</script>
