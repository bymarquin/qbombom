<template>
  <div class="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 font-sans overflow-hidden">
    <!-- Header Entregador -->
    <header class="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-5 shrink-0 shadow-sm dark:shadow-none z-10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          Q
        </div>
        <div>
          <h1 class="text-lg font-bold leading-none tracking-tight text-neutral-900 dark:text-neutral-100">Entregas</h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1">
            <span class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-green-500' : 'bg-red-500'"></span>
            {{ isOnline ? 'Online' : 'Reconectando...' }}
          </p>
        </div>
      </div>

      <button 
        @click="fazerLogout"
        class="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-400 transition-colors"
      >
        <LogOut class="w-5 h-5" />
      </button>
    </header>

    <!-- Content / Tabs -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Tabs (Aguardando Retirada / Em Rota) -->
      <div class="flex bg-white dark:bg-neutral-900 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0 gap-2">
        <button 
          @click="abaAtiva = 'pronto'"
          class="flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1"
          :class="abaAtiva === 'pronto' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
        >
          <Package class="w-5 h-5 mb-0.5" :class="abaAtiva === 'pronto' ? 'text-blue-500' : ''" />
          Coleta
          <span v-if="pedidosProntos.length" class="absolute top-2 right-4 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{{ pedidosProntos.length }}</span>
        </button>
        <button 
          @click="abaAtiva = 'em_rota'"
          class="flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-colors flex flex-col items-center justify-center gap-1 relative"
          :class="abaAtiva === 'em_rota' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
        >
          <Motorcycle class="w-5 h-5 mb-0.5" :class="abaAtiva === 'em_rota' ? 'text-amber-500' : ''" />
          Minhas Rotas
          <span v-if="pedidosEmRota.length" class="absolute top-2 right-4 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{{ pedidosEmRota.length }}</span>
        </button>
      </div>

      <!-- Lista de Pedidos -->
      <div class="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-950 pb-20 no-scrollbar">
        
        <!-- Empty State -->
        <div v-if="pedidosListados.length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 text-center gap-3">
          <MapPinOff class="w-12 h-12 opacity-50" />
          <p class="font-medium">Nenhum pedido <br>{{ abaAtiva === 'pronto' ? 'aguardando coleta' : 'em rota no momento' }}</p>
        </div>

        <!-- Cards -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
          <div 
            v-for="pedido in pedidosListados" 
            :key="pedido.id"
            class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden flex flex-col"
          >
          <!-- Card Header -->
          <div class="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
            <span class="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
              {{ pedido.trackingCode || `#${pedido.id.toString().substring(0,6)}` }}
            </span>
            <span class="text-xs font-bold px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              {{ formatarTempo(pedido.createdAt) }}
            </span>
          </div>

          <!-- Card Body -->
          <div class="p-4 space-y-4 flex-1 flex flex-col">
            
            <!-- Cliente & Contato -->
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-500 font-semibold uppercase tracking-wider mb-1">Cliente</p>
              <p class="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight">{{ pedido.customerName || 'Cliente não identificado' }}</p>
              <div v-if="pedido.customerPhone" class="mt-2">
                <a :href="`https://wa.me/55${pedido.customerPhone.replace(/\D/g, '')}`" target="_blank" class="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg">
                  <Phone class="w-4 h-4" /> Chamar WhatsApp
                </a>
              </div>
            </div>

            <!-- Endereço + Navegação -->
            <div class="bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/50 flex gap-3 items-start">
              <MapPin class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ pedido.deliveryAddress || 'Endereço a combinar ou Retirada' }}</p>
                <!-- Navigation buttons when coordinates are available -->
                <div v-if="pedido.deliveryLatitude != null && pedido.deliveryLongitude != null" class="flex gap-2 mt-2 flex-wrap">
                  <a
                    :href="`https://www.google.com/maps/dir/?api=1&destination=${pedido.deliveryLatitude},${pedido.deliveryLongitude}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Navigation class="w-3.5 h-3.5" /> Google Maps
                  </a>
                  <a
                    :href="`https://waze.com/ul?ll=${pedido.deliveryLatitude},${pedido.deliveryLongitude}&navigate=yes`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors"
                  >
                    <Navigation class="w-3.5 h-3.5" /> Waze
                  </a>
                </div>
                <!-- Fallback: address-based navigation when no coordinates -->
                <div v-else-if="pedido.deliveryAddress" class="flex gap-2 mt-2">
                  <a
                    :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.deliveryAddress)}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    <Navigation class="w-3.5 h-3.5" /> Navegar pelo endereço
                  </a>
                </div>
              </div>
            </div>

            <!-- Valores e Pagamento -->
            <div class="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/50 mt-auto">
              <div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Pagamento</p>
                <p class="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1 mt-0.5">
                  <CreditCard class="w-4 h-4 text-neutral-400" v-if="pedido.paymentMethod !== 'Dinheiro'" />
                  <Banknote class="w-4 h-4 text-green-500" v-else />
                  {{ pedido.paymentMethod || 'Não informado' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">A cobrar</p>
                <p class="text-lg font-black text-red-600">{{ formatarMoeda(pedido.total) }}</p>
              </div>
            </div>

          </div>

          <!-- Card Actions -->
          <div class="p-4 border-t border-neutral-100 dark:border-neutral-800/50 bg-white dark:bg-neutral-900">
            <button 
              v-if="abaAtiva === 'pronto'"
              @click="mudarStatus(pedido.id, 'em_rota')"
              class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Motorcycle class="w-5 h-5" /> Iniciar Rota
            </button>

            <button 
              v-else-if="abaAtiva === 'em_rota'"
              @click="mudarStatus(pedido.id, 'entregue')"
              class="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 class="w-5 h-5" /> Confirmar Entrega
            </button>
          </div>
        </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { OrderService, AuthService } from '@/services/http';
import { useOrderSocket } from '@/composables/useOrderSocket';
import { formatarTempo, formatarMoeda } from '@/utils/formatters';
import {
  LogOut, Package, Bike as Motorcycle, MapPin, Navigation, Phone,
  MapPinOff, CheckCircle2, CreditCard, Banknote
} from 'lucide-vue-next';

const router = useRouter();
const toast = useToastStore();

const pedidos = ref([]);
const isOnline = ref(true);
const abaAtiva = ref('pronto'); // 'pronto' | 'em_rota'

// Filtra apenas pedidos "Entrega"
const pedidosProntos = computed(() => pedidos.value.filter(p => p.status === 'pronto' && p.type === 'Entrega'));
const pedidosEmRota = computed(() => pedidos.value.filter(p => p.status === 'em_rota' && p.type === 'Entrega'));

const pedidosListados = computed(() => abaAtiva.value === 'pronto' ? pedidosProntos.value : pedidosEmRota.value);

const carregarPedidos = async () => {
  try {
    const { data } = await OrderService.getOrders();
    pedidos.value = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    isOnline.value = true;
  } catch {
    isOnline.value = false;
  }
};

function onOrderCreated(novoPedido) {
  const index = pedidos.value.findIndex(p => p.id === novoPedido.id);
  if (index > -1) {
    pedidos.value[index] = { ...pedidos.value[index], ...novoPedido };
    return;
  }

  pedidos.value.push(novoPedido);
}

function onOrderUpdated(atualizado) {
  const index = pedidos.value.findIndex(p => p.id === atualizado.id);
  if (index > -1) {
    if (['entregue', 'cancelado'].includes(atualizado.status)) {
      pedidos.value.splice(index, 1);
    } else {
      pedidos.value[index] = { ...pedidos.value[index], ...atualizado };
    }
  } else if (['pronto', 'em_rota'].includes(atualizado.status)) {
    pedidos.value.push(atualizado);
  }
}

const mudarStatus = async (id, novoStatus) => {
  try {
    // Optimistic UI
    const pedidoIndex = pedidos.value.findIndex(p => p.id === id);
    if (pedidoIndex > -1) {
      if (novoStatus === 'entregue') {
        pedidos.value.splice(pedidoIndex, 1);
        toast.success('Entrega finalizada com sucesso!');
      } else {
        pedidos.value[pedidoIndex].status = novoStatus;
        toast.success('Rota iniciada. Cuidado no trânsito!');
      }
    }

    await OrderService.updateOrderStatus(id, novoStatus);
  } catch {
    carregarPedidos(); // revert on fail
    toast.error('Erro ao atualizar. Tente novamente.');
  }
};

const fazerLogout = () => AuthService.logout();

useOrderSocket({
  onConnect:    () => { isOnline.value = true },
  onDisconnect: () => { isOnline.value = false; toast.error('Sem conexão. Tentando reconectar...') },
  onCreated:    onOrderCreated,
  onUpdated:    onOrderUpdated,
});

onMounted(() => {
  if (!AuthService.isAuthenticated()) { router.push('/login'); return; }
  carregarPedidos();
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
