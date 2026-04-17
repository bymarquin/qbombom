<template>
  <div
    class="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans"
  >
    <!-- Topbar KDS (Tema Claro) -->
    <header
      class="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between px-6 shrink-0 shadow-sm dark:shadow-none shadow-neutral-200/50 z-10"
    >
      <div class="flex items-center gap-4">
        <div class="flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="10" class="fill-red-600" />
            <text
              x="16"
              y="22"
              font-size="18"
              font-weight="900"
              fill="white"
              text-anchor="middle"
              font-family="system-ui, sans-serif"
            >
              Q
            </text>
          </svg>
        </div>
        <div>
          <h1
            class="text-xl font-bold leading-none tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            KDS - Cozinha
          </h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-1 mt-1">
            <span
              class="w-2 h-2 rounded-full"
              :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            {{ isOnline ? 'Conectado • Atualizando em tempo real' : 'Aguardando conexão...' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div
          class="bg-neutral-50 dark:bg-neutral-950 px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
        >
          <Clock class="w-4 h-4 text-neutral-400" />
          {{ relogio }}
        </div>

        <button
          @click="fazerLogout"
          class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950 rounded-lg text-sm font-medium transition-colors border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-sm dark:shadow-none"
        >
          <LogOut class="w-4 h-4" />
          Sair
        </button>
      </div>
    </header>

    <!-- Board Kanban -->
    <main class="flex-1 flex overflow-x-auto overflow-y-hidden p-4 lg:p-6 gap-4 lg:gap-6 snap-x snap-mandatory custom-scrollbar">
      <!-- Coluna: Novos -->
      <section
        class="min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-none snap-center shrink-0 lg:shrink"
      >
        <div
          class="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center shrink-0"
        >
          <h2
            class="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-neutral-100"
          >
            <AlertCircle class="w-5 h-5 text-blue-600" /> Recebidos
          </h2>
          <span
            class="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-sm font-bold border border-blue-100"
          >
            {{ pedidosNovos.length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div
            v-if="pedidosNovos.length === 0"
            class="h-full flex flex-col items-center justify-center text-neutral-400"
          >
            <ChefHat class="w-12 h-12 mb-3 opacity-20" />
            <p>Nenhum pedido novo</p>
          </div>

          <PedidoCard
            v-for="pedido in pedidosNovos"
            :key="pedido.id"
            :pedido="pedido"
            acao-texto="Preparar"
            acao-cor="bg-blue-600 hover:bg-blue-700 text-white"
            @acao="atualizarStatus(pedido.id, 'em_preparo')"
          />
        </div>
      </section>

      <!-- Coluna: Em Preparo -->
      <section
        class="min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-none snap-center shrink-0 lg:shrink"
      >
        <div
          class="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center shrink-0"
        >
          <h2
            class="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-neutral-100"
          >
            <Flame class="w-5 h-5 text-amber-500" /> Em Preparo
          </h2>
          <span
            class="bg-amber-50 text-amber-700 py-1 px-3 rounded-full text-sm font-bold border border-amber-100"
          >
            {{ pedidosPreparo.length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div
            v-if="pedidosPreparo.length === 0"
            class="h-full flex flex-col items-center justify-center text-neutral-400"
          >
            <Flame class="w-12 h-12 mb-3 opacity-20" />
            <p>Nenhum pedido na chapa</p>
          </div>

          <PedidoCard
            v-for="pedido in pedidosPreparo"
            :key="pedido.id"
            :pedido="pedido"
            acao-texto="Finalizar (Pronto)"
            acao-cor="bg-amber-500 hover:bg-amber-600 text-white"
            @acao="atualizarStatus(pedido.id, 'pronto')"
          />
        </div>
      </section>

      <!-- Coluna: Prontos -->
      <section
        class="min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-none snap-center shrink-0 lg:shrink"
      >
        <div
          class="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center shrink-0"
        >
          <h2
            class="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-neutral-100"
          >
            <CheckCircle2 class="w-5 h-5 text-green-500" /> Prontos (Aguardando Retirada)
          </h2>
          <span
            class="bg-green-50 text-green-700 py-1 px-3 rounded-full text-sm font-bold border border-green-100"
          >
            {{ pedidosProntos.length }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div
            v-if="pedidosProntos.length === 0"
            class="h-full flex flex-col items-center justify-center text-neutral-400"
          >
            <CheckCircle2 class="w-12 h-12 mb-3 opacity-20" />
            <p>Nenhum pedido aguardando retirada</p>
          </div>

          <PedidoCard
            v-for="pedido in pedidosProntos"
            :key="pedido.id"
            :pedido="pedido"
            acao-texto="Arquivar / Entregue"
            acao-cor="bg-green-600 hover:bg-green-700 text-white"
            @acao="atualizarStatus(pedido.id, 'entregue')"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { OrderService, AuthService } from '@/services/http'
import { useOrderSocket } from '@/composables/useOrderSocket'
import { LogOut, Clock, AlertCircle, Flame, CheckCircle2, ChefHat } from 'lucide-vue-next'
import PedidoCard from '@/components/kds/PedidoCard.vue'

const router = useRouter()
const toast = useToastStore()

const pedidos = ref([])
const isOnline = ref(true)
const relogio = ref('')
let relogioInterval = null

// Computeds por status
const pedidosNovos = computed(() => pedidos.value.filter((p) => p.status === 'novo'))
const pedidosPreparo = computed(() => pedidos.value.filter((p) => p.status === 'em_preparo'))
const pedidosProntos = computed(() => pedidos.value.filter((p) => p.status === 'pronto'))

// Atualizar relógio
const atualizarRelogio = () => {
  const agora = new Date()
  relogio.value = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const carregarPedidos = async () => {
  try {
    const { data } = await OrderService.getOrders()
    pedidos.value = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    isOnline.value = true
  } catch {
    isOnline.value = false
  }
}

function onOrderCreated(novoPedido) {
  toast.info(`Novo pedido recebido!`)
  pedidos.value.push(novoPedido)
}

function onOrderUpdated(atualizado) {
  const index = pedidos.value.findIndex((p) => p.id === atualizado.id)
  if (index === -1) return
  if (atualizado.status === 'entregue' || atualizado.status === 'cancelado') {
    pedidos.value.splice(index, 1)
  } else {
    pedidos.value[index].status = atualizado.status
  }
}

const TOAST_POR_STATUS = {
  em_preparo: 'Pedido foi para a chapa!',
  pronto: 'Pedido marcado como pronto!',
}

const atualizarStatus = async (id, novoStatus) => {
  const index = pedidos.value.findIndex((p) => p.id === id)
  if (index > -1) {
    novoStatus === 'entregue'
      ? pedidos.value.splice(index, 1)
      : pedidos.value[index].status = novoStatus
  }

  try {
    await OrderService.updateOrderStatus(id, novoStatus)
    if (TOAST_POR_STATUS[novoStatus]) toast.success(TOAST_POR_STATUS[novoStatus])
  } catch {
    carregarPedidos()
  }
}

useOrderSocket({
  onConnect:    () => { isOnline.value = true; toast.success('KDS conectado!') },
  onDisconnect: () => { isOnline.value = false; toast.error('KDS perdeu conexão. Reconectando...') },
  onCreated:    onOrderCreated,
  onUpdated:    onOrderUpdated,
})

onMounted(() => {
  if (!AuthService.isAuthenticated()) { router.push('/login'); return }
  atualizarRelogio()
  relogioInterval = setInterval(atualizarRelogio, 1000)
  carregarPedidos()
})

onUnmounted(() => clearInterval(relogioInterval))

const fazerLogout = () => {
  AuthService.logout()
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(243, 244, 246, 0.5); /* bg-neutral-100 dark:bg-neutral-800 */
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(209, 213, 219, 0.8); /* bg-neutral-300 */
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 1); /* bg-neutral-400 */
}
</style>
