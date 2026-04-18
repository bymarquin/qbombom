<template>
  <div class="h-full flex flex-col font-sans">
    <!-- Header -->
    <header
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0"
    >
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Visão Geral
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
          Acompanhe o desempenho da sua loja.
        </p>
      </div>

      <!-- Filtro -->
      <div
        class="flex bg-white dark:bg-neutral-900 rounded-lg shadow-sm dark:shadow-none border border-neutral-200 dark:border-neutral-800 p-1"
      >
        <button
          @click="changePeriod('today')"
          :class="
            period === 'today'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors"
        >
          Hoje
        </button>
        <button
          @click="changePeriod('week')"
          :class="
            period === 'week'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          7 Dias
        </button>
        <button
          @click="changePeriod('month')"
          :class="
            period === 'month'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          Mês
        </button>
      </div>
    </header>

    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <div
        class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <template v-else>
      <!-- Grid KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
        <!-- Card Faturamento -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <DollarSign class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Faturamento
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ formatarMoeda(metrics.revenue) }}
          </p>
        </div>

        <!-- Card Pedidos -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <ShoppingBag class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Total de Pedidos
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ metrics.totalOrders }}
          </p>
        </div>

        <!-- Card Ticket Médio -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <Receipt class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Ticket Médio
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ formatarMoeda(metrics.averageTicket) }}
          </p>
        </div>

        <!-- Card Cancelamentos -->
        <div
          class="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div
              class="w-10 h-10 bg-neutral-50 dark:bg-neutral-950 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/50"
            >
              <XOctagon class="w-5 h-5" />
            </div>
          </div>
          <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
            Cancelamentos
          </h3>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ metrics.cancellations }}
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <!-- Tabela Pedidos -->
        <div
          class="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col overflow-hidden"
        >
          <div
            class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center"
          >
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Pedidos Recentes
            </h2>
            <RouterLink
              to="/app/pedidos"
              class="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
              >Ver Todos</RouterLink
            >
          </div>

          <div class="flex-1 overflow-y-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead
                class="bg-neutral-50/50 dark:bg-neutral-800/30 text-neutral-500 dark:text-neutral-400 font-medium sticky top-0"
              >
                <tr>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Pedido
                  </th>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Cliente/Origem
                  </th>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/50 font-medium"
                  >
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                <tr v-if="recentOrders.length === 0">
                  <td
                    colspan="4"
                    class="px-6 py-8 text-center text-neutral-500 dark:text-neutral-500"
                  >
                    <div class="flex flex-col items-center gap-2">
                      <ClipboardList class="w-8 h-8 opacity-50" />
                      Nenhum pedido recente.
                    </div>
                  </td>
                </tr>
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    #{{ order.trackingCode || order.id }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    <div>{{ order.customerName || 'Cliente' }}</div>
                    <div class="text-xs text-neutral-400 mt-0.5">{{ order.type }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-2.5 py-1 rounded-md text-xs font-medium border"
                      :class="statusClass(order.status)"
                    >
                      {{ statusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    {{ formatarMoeda(order.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Produtos -->
        <div
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex flex-col overflow-hidden"
        >
          <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/50">
            <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Top Produtos
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div
              v-if="topProducts.length === 0"
              class="text-center text-neutral-500 dark:text-neutral-500 py-4 text-sm"
            >
              Nenhum produto vendido neste período.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="(prod, idx) in topProducts" :key="prod.id" class="flex items-center gap-4">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs border shrink-0"
                  :class="
                    idx === 0
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20'
                      : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800/50'
                  "
                >
                  {{ idx + 1 }}º
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {{ prod.name || 'Produto Excluído' }}
                  </h4>
                  <p class="text-xs text-neutral-500 dark:text-neutral-500">
                    {{ prod.quantity }} vendas
                  </p>
                </div>
                <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {{ formatarMoeda(prod.revenue) }}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DollarSign, ShoppingBag, Receipt, XOctagon, ClipboardList } from 'lucide-vue-next'
import { DashboardService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { formatarMoeda } from '@/utils/formatters'
import { useOrderStatus } from '@/composables/useOrderStatus'

const toast = useToastStore()
const loading = ref(true)
const period = ref('today')

const metrics = ref({
  revenue: 0,
  totalOrders: 0,
  averageTicket: 0,
  cancellations: 0,
})
const recentOrders = ref([])
const topProducts = ref([])

const loadDashboard = async () => {
  loading.value = true
  try {
    const res = await DashboardService.getMetrics(period.value)
    metrics.value = res.data.metrics
    recentOrders.value = res.data.recentOrders
    topProducts.value = res.data.topProducts
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar dados do dashboard.')
  } finally {
    loading.value = false
  }
}

const changePeriod = (newPeriod) => {
  period.value = newPeriod
  loadDashboard()
}

const { statusLabel, statusClass } = useOrderStatus()

onMounted(loadDashboard)
</script>
