<template>
  <div
    class="h-dvh flex flex-col bg-neutral-50 dark:bg-neutral-950 font-sans relative overflow-hidden text-neutral-900 dark:text-neutral-100"
  >
    <!-- Banner Loja Fechada -->
    <div
      v-if="!loadingCatalog && !isStoreOpen"
      class="bg-red-600 text-white px-4 py-3 text-center sticky top-0 z-50 shadow-md"
    >
      <div class="flex items-center justify-center gap-2 font-bold">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Loja Fechada no Momento
      </div>
      <p class="text-xs text-red-100 mt-1">
        Você pode visualizar o cardápio, mas não será possível realizar pedidos agora.
      </p>
    </div>

    <!-- Cabeçalho Principal -->
    <header
      class="bg-white dark:bg-neutral-900 shrink-0 border-b border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none z-10 relative"
    >
      <div class="px-5 pt-4 pb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Logo Exata do Login -->
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
            <div class="flex flex-col leading-none">
              <span class="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Qbombom</span>
              <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 -mt-0.5">Sorvetes</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div
              v-if="mesaDoQr"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <MapPin class="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
              <span class="text-xs font-bold text-red-700 dark:text-red-400">{{ mesaDoQr }}</span>
            </div>
            <button
              @click="toggleDark()"
              class="flex items-center justify-center w-10 h-10 text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-xl transition-all hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-600/30"
              aria-label="Alternar tema"
            >
              <Sun v-if="isDark" class="w-5 h-5 text-red-500" />
              <Moon v-else class="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      <!-- Abas de Categoria (Scroll Horizontal) -->
      <div class="px-5 pb-0 flex overflow-x-auto no-scrollbar gap-4">
        <!-- Aba "Todas" -->
        <button
          @click="categoriaAtiva = null"
          class="pb-3 pt-2 text-sm font-medium whitespace-nowrap transition-all relative flex items-center gap-1.5"
          :class="categoriaAtiva === null ? 'text-red-600 font-bold' : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'"
        >
          Todas
          <span
            class="text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none"
            :class="categoriaAtiva === null ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
          >{{ totalProdutos }}</span>
          <div v-if="categoriaAtiva === null" class="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-t-md"></div>
        </button>

        <button
          v-for="categoria in categorias"
          :key="categoria.id"
          @click="categoriaAtiva = categoria.id"
          class="pb-3 pt-2 text-sm font-medium whitespace-nowrap transition-all relative flex items-center gap-1.5"
          :class="
            categoriaAtiva === categoria.id
              ? 'text-red-600 font-bold'
              : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-100'
          "
        >
          {{ categoria.name }}
          <span
            v-if="categoria.products?.length"
            class="text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none"
            :class="categoriaAtiva === categoria.id ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
          >{{ categoria.products.length }}</span>
          <div
            v-if="categoriaAtiva === categoria.id"
            class="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-t-md"
          ></div>
        </button>
      </div>

      <!-- Busca -->
      <div class="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
        <div class="relative">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            v-model="termoBusca"
            type="text"
            placeholder="Buscar no cardápio..."
            class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-600/15 transition-all"
          />
        </div>
      </div>
    </header>

    <!-- Lista de Produtos -->
    <main class="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
      <div class="max-w-5xl mx-auto p-4 pb-24">
      <!-- Seção Pedir Novamente -->
      <div v-if="historico.length > 0 && consentimento === 'aceito'" class="mb-4">
        <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Pedir Novamente</p>
        <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <div
            v-for="pedido in historico"
            :key="pedido.id"
            class="shrink-0 w-56 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 flex flex-col gap-2 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs text-neutral-400">{{ formatarDataCurta(pedido.date) }}</span>
              <span class="text-xs font-bold text-red-600">{{ formatarMoeda(pedido.total) }}</span>
            </div>
            <ul class="text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5 flex-1">
              <li v-for="(item, i) in pedido.items.slice(0, 3)" :key="i" class="truncate">
                {{ item.quantity }}x {{ item.productName }}
                <span v-if="item.variationName" class="text-neutral-400">({{ item.variationName }})</span>
              </li>
              <li v-if="pedido.items.length > 3" class="text-neutral-400">+ {{ pedido.items.length - 3 }} item(s)...</li>
            </ul>
            <button
              @click="repetirPedido(pedido)"
              class="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Repetir Pedido
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="loadingCatalog"
        class="h-40 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-500 gap-3"
      >
        <div
          class="w-8 h-8 border-4 border-neutral-200 dark:border-neutral-800 border-t-red-600 rounded-full animate-spin"
        ></div>
        <p class="text-sm font-medium">Carregando cardápio...</p>
      </div>

      <div
        v-else-if="produtosFiltrados.length === 0"
        class="h-40 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-500 text-sm"
      >
        <p>Nenhum produto nesta categoria.</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          @click="abrirModalProduto(produto)"
          :disabled="loadingProdutoId === produto.id"
          class="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800/50 shadow-sm dark:shadow-none text-left transition-all active:scale-[0.97] disabled:opacity-70 flex flex-col"
        >
          <!-- Imagem -->
          <div class="w-full h-36 bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
            <img
              v-if="produto.imageUrl"
              :src="produto.imageUrl"
              :alt="produto.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Coffee class="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
            </div>
            <!-- Spinner de loading -->
            <div
              v-if="loadingProdutoId === produto.id"
              class="absolute inset-0 bg-black/30 flex items-center justify-center"
            >
              <div class="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>

          <!-- Conteúdo -->
          <div class="p-3 flex flex-col flex-1 justify-between">
            <div>
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight mb-1 line-clamp-2">
                {{ produto.name }}
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {{ produto.description }}
              </p>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="font-bold text-red-600 dark:text-red-400 text-sm">{{ precoMinimo(produto) }}</span>
              <div class="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              </div>
            </div>
          </div>
        </button>
      </div>
      </div>
    </main>

    <!-- Banner de Consentimento de Cookies -->
    <Transition name="slide-up">
      <div
        v-if="consentimento === null"
        class="absolute bottom-0 left-0 w-full z-50 p-4 pointer-events-none"
      >
        <div class="bg-neutral-900 dark:bg-neutral-800 text-white rounded-2xl p-4 shadow-2xl pointer-events-auto border border-neutral-700">
          <p class="text-sm font-medium mb-1">Guardar seus pedidos? 🍨</p>
          <p class="text-xs text-neutral-400 mb-3">Salvamos seus últimos 3 pedidos neste dispositivo para você repetir com um toque.</p>
          <div class="flex gap-2">
            <button
              @click="recusarCookies"
              class="flex-1 py-2 rounded-lg text-xs font-semibold bg-neutral-700 hover:bg-neutral-600 transition-colors"
            >Não, obrigado</button>
            <button
              @click="aceitarCookies"
              class="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 transition-colors"
            >Aceitar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Botão Flutuante (Sacola) -->
    <div
      v-if="carrinho.length > 0"
      class="absolute bottom-0 left-0 w-full p-4 pb-6 z-40 pointer-events-none"
    >
      <button
        @click="abrirSacola"
        class="w-full py-4 bg-red-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-xl shadow-red-900/20 dark:shadow-none hover:shadow-2xl flex items-center justify-between px-5 pointer-events-auto"
      >
        <div class="flex items-center gap-3">
          <div class="bg-white text-red-600 dark:bg-neutral-900/20 dark:text-white px-2.5 py-0.5 rounded text-sm font-bold">
            {{ carrinho.length }}
          </div>
          <span>Ver Sacola</span>
        </div>
        <span>{{ formatarMoeda(subtotal) }}</span>
      </button>
    </div>

    <!-- MODAL DO PRODUTO -->
    <ProductModal
      v-model="modalProduto"
      :produto-detalhado="produtoDetalhado"
      :is-store-open="isStoreOpen"
      @add-item="adicionarItemAoCarrinho"
    />

    <!-- SLIDE OVER DA SACOLA/CHECKOUT -->
    <CartCheckout
      v-model:is-open="sacolaAberta"
      v-model:carrinho="carrinho"
      v-model:checkout="checkout"
      :subtotal="subtotal"
      :pode-finalizar-pedido="podeFinalizarPedido"
      :enviando="enviando"
      :is-store-open="isStoreOpen"
      @enviar-pedido="enviarPedido"
      @remover-item="removerItem"
    />

    <!-- TELA DE SUCESSO -->
    <OrderSuccess
      v-model="telaSucesso"
      :subtotal-enviado="subtotalEnviado"
      :checkout-enviado="checkoutEnviado"
      :pix-payload="pixPayloadSucesso"
      @acompanhar="abrirAcompanhamento"
      @fechar="fecharSucesso"
    />

    <!-- TELA DE ACOMPANHAMENTO (RASTREIO) -->
    <OrderTracking
      v-model="rastreioAberto"
      :pedido-rastreado="pedidoRastreado"
      :status-fluxo="statusFluxo"
      :altura-linha-progresso="alturaLinhaProgresso"
      :status-maior-ou-igual="statusMaiorOuIgual"
      @limpar="limparRastreio"
      @order-cancelled="carregarRastreio"
    />

    <!-- Botão Flutuante "Acompanhar Pedido" na Tela Inicial (caso exista pedido rastreado) -->
    <div
      v-if="pedidoRastreado && !rastreioAberto && !sacolaAberta && !telaSucesso"
      class="absolute bottom-20 left-0 w-full px-4 z-10 flex justify-center pointer-events-none"
    >
      <button
        @click="rastreioAberto = true"
        class="bg-neutral-900 text-white rounded-full px-5 py-3 text-sm font-bold shadow-xl dark:shadow-none flex items-center gap-2 pointer-events-auto hover:scale-105 active:scale-95 transition-transform"
      >
        <div
          class="w-2 h-2 rounded-full animate-pulse"
          :class="pedidoRastreado.status === 'pronto' ? 'bg-green-400' : 'bg-yellow-400'"
        ></div>
        {{
          pedidoRastreado.status === "pronto" ? "Pedido Pronto! Ver Detalhes" : "Acompanhar Pedido"
        }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted } from "vue";
import { useOrderHistory } from "@/composables/useOrderHistory";
import { useDark, useToggle } from "@vueuse/core";
import { useToastStore } from "@/stores/toast";
import { CatalogService, OrderService, SettingService } from "@/services/http";
import { requestNotificationPermission, showNotification } from "@/utils/notifications";
import { syncToLocalStorage } from "@/composables/useLocalStorage";
import { generatePixPayload } from "@/utils/pix";
import { limparTelefone, mascararTelefone } from "@/utils/formatters";
import { formatarMoeda } from "@/utils/formatters";
import socket from "@/services/socket";
import ProductModal from "@/components/customer/ProductModal.vue";
import CartCheckout from "@/components/customer/CartCheckout.vue";
import OrderSuccess from "@/components/customer/OrderSuccess.vue";
import OrderTracking from "@/components/customer/OrderTracking.vue";
import { Coffee, Sun, Moon, MapPin } from "lucide-vue-next";

const isDark = useDark();
const toggleDark = useToggle(isDark);

const toast = useToastStore();

const { consentimento, aceitarCookies, recusarCookies, getHistorico, salvarPedido } = useOrderHistory()
const mesaDoQr = ref(null)
const historico = ref(getHistorico())

const formatarDataCurta = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const repetirPedido = (pedido) => {
  carrinho.value = pedido.items.map((item) => ({ ...item }))
  checkout.value.nome = pedido.checkout.nome || checkout.value.nome
  checkout.value.telefone = pedido.checkout.telefone || checkout.value.telefone
  checkout.value.tipo = pedido.checkout.tipo || 'Mesa'
  checkout.value.pagamento = pedido.checkout.pagamento || 'PIX'
  if (pedido.checkout.endereco) checkout.value.endereco = { ...pedido.checkout.endereco }
  sacolaAberta.value = true
  toast.success('Pedido anterior restaurado na sacola!')
}

// Estados
const categorias = shallowRef([]);
const categoriaAtiva = ref(null);
const loadingCatalog = ref(false);
const storeSettings = shallowRef(null);

const isStoreOpen = computed(() => {
  if (!storeSettings.value || !storeSettings.value.hours) return true; // Assume aberto se der erro

  const hours = storeSettings.value.hours;
  if (hours.isOpen === false) return false;

  if (hours.schedule && Array.isArray(hours.schedule)) {
    const localNow = new Date();
    const dayMap = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
    const currentDayStr = dayMap[localNow.getDay()];
    const dayConfig = hours.schedule.find((d) => d.id === currentDayStr);

    if (dayConfig && !dayConfig.active) return false;
    if (dayConfig) {
      const currentTotalMinutes = localNow.getHours() * 60 + localNow.getMinutes();
      const [openHour, openMin] = dayConfig.open.split(":").map(Number);
      const [closeHour, closeMin] = dayConfig.close.split(":").map(Number);
      const openTotalMinutes = openHour * 60 + openMin;
      const closeTotalMinutes = closeHour * 60 + closeMin;

      if (closeTotalMinutes < openTotalMinutes) {
        if (currentTotalMinutes > closeTotalMinutes && currentTotalMinutes < openTotalMinutes)
          return false;
      } else {
        if (currentTotalMinutes < openTotalMinutes || currentTotalMinutes > closeTotalMinutes)
          return false;
      }
    }
  }

  return true;
});

const loadFromStorage = (key, defaultVal) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultVal;
    const parsed = JSON.parse(item);
    // Para objetos (como o checkout), fazemos o merge para não perder propriedades novas
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return { ...defaultVal, ...parsed, endereco: { ...defaultVal.endereco, ...parsed.endereco } };
    }
    return parsed;
  } catch {
    return defaultVal;
  }
};

const carrinho = ref(loadFromStorage("qbombom_carrinho", []));
const sacolaAberta = ref(false);

const checkout = ref(
  loadFromStorage("qbombom_checkout", {
    nome: "",
    telefone: "",
    tipo: "Mesa",
    mesa: "",
    whatsappOptIn: false,
    pagamento: "PIX",
    precisaTroco: false,
    trocoPara: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      complemento: "",
    },
  }),
);

syncToLocalStorage("qbombom_carrinho", carrinho);
syncToLocalStorage("qbombom_checkout", checkout);

const podeFinalizarPedido = computed(() => {
  if (!checkout.value.nome || !checkout.value.telefone) return false;
  if (checkout.value.tipo === "Entrega") {
    return Boolean(
      checkout.value.endereco.rua &&
      checkout.value.endereco.numero &&
      checkout.value.endereco.bairro,
    );
  }
  return true;
});
const enviando = ref(false);

const telaSucesso = ref(false);
const checkoutEnviado = ref({});
const subtotalEnviado = ref(0);
const pedidoCriado = ref(null);

const pixPayloadSucesso = computed(() => {
  if (!pedidoCriado.value || !storeSettings.value?.pix?.key) return "";
  const pix = storeSettings.value.pix;
  const profile = storeSettings.value?.profile;
  const name = profile?.name || "Qbombom Sorvetes";
  const city = (profile?.address?.city || "Sao Paulo").split("-")[0].trim();
  return generatePixPayload(pix.key, pix.type || "cpf", name, city, pedidoCriado.value.total, pedidoCriado.value.id || "***");
});

// --- Lógica Rastreio (Tracking) ---
const rastreioAberto = ref(false);
const rastreioAtual = ref(null);
const pedidoRastreado = ref(null);

const statusFluxo = computed(() => {
  const base = [];

  if (pedidoRastreado.value && pedidoRastreado.value.paymentMethod === "PIX") {
    base.push({
      id: "aguardando_pagamento",
      label: "Aguardando Pagamento",
      activeMsg: "Aguardando seu PIX...",
    });
  }

  base.push(
    { id: "novo", label: "Pedido Recebido", activeMsg: "Aguardando início..." },
    { id: "em_preparo", label: "Na Cozinha", activeMsg: "Preparando com carinho!" },
    { id: "pronto", label: "Pronto", activeMsg: "Quase lá..." },
  );

  if (pedidoRastreado.value && pedidoRastreado.value.type === "Entrega") {
    base.push(
      { id: "em_rota", label: "A Caminho", activeMsg: "Saiu para entrega!" },
      { id: "entregue", label: "Entregue", activeMsg: "Aproveite seu pedido!" },
    );
  }

  base.push({ id: "finalizado", label: "Concluído", activeMsg: "Obrigado pela preferência! 🎉" });

  return base;
});

const carregarRastreio = async () => {
  if (!rastreioAtual.value) return;
  try {
    const { data } = await OrderService.trackPublicOrder(rastreioAtual.value);
    pedidoRastreado.value = data;
  } catch (error) {
    if (error?.response?.status === 404) {
      limparRastreio();
    }
  }
};

const limparRastreio = () => {
  localStorage.removeItem("qbombom_tracking");
  rastreioAtual.value = null;
  pedidoRastreado.value = null;
  rastreioAberto.value = false;
};

// Utils Rastreio
const statusMaiorOuIgual = (statusIdVerificar) => {
  if (!pedidoRastreado.value) return false;
  const indexAtual = statusFluxo.value.findIndex((s) => s.id === pedidoRastreado.value.status);
  const indexVerificar = statusFluxo.value.findIndex((s) => s.id === statusIdVerificar);
  return indexAtual >= indexVerificar;
};

const alturaLinhaProgresso = computed(() => {
  if (!pedidoRastreado.value) return "0%";
  const indexAtual = statusFluxo.value.findIndex((s) => s.id === pedidoRastreado.value.status);
  const totalSteps = statusFluxo.value.length - 1;

  if (indexAtual <= 0) return "10%";
  if (indexAtual === totalSteps) return "100%";

  return `${(indexAtual / totalSteps) * 100}%`;
});
// ----------------------------------

// Busca API - Público
const carregarCatalogo = async () => {
  loadingCatalog.value = true;
  try {
    try {
      const res = await SettingService.getSettings();
      if (res.data) storeSettings.value = res.data;
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
    const { data } = await CatalogService.getCategories();
    const categoriasNormalizadas = Array.isArray(data) ? data : [];
    categorias.value = categoriasNormalizadas;
  } catch (err) {
    console.error(err);
    toast.error("Erro ao carregar o cardápio. Recarregue a página.");
  } finally {
    loadingCatalog.value = false;
  }
};

onMounted(() => {
  carregarCatalogo();

  // Ghost Login Load
  const ghostProfile = localStorage.getItem("qbombom_ghost_profile");
  if (ghostProfile) {
    try {
      const parsed = JSON.parse(ghostProfile);
      checkout.value.nome = parsed.nome || "";
      checkout.value.telefone = mascararTelefone(parsed.telefone || "");
      if (parsed.endereco) {
        checkout.value.endereco = parsed.endereco;
      }
    } catch {
      // ignore
    }
  }

  // Lê parâmetros da URL
  const params = new URLSearchParams(window.location.search);

  // Lê parâmetro ?mesa= do QR Code da mesa
  const mesaParam = params.get('mesa')
  if (mesaParam) {
    checkout.value.tipo = 'Mesa'
    checkout.value.mesa = `Mesa ${mesaParam.padStart(2, '0')}`
    mesaDoQr.value = checkout.value.mesa
    window.history.replaceState({}, '', window.location.pathname)
  }

  // Checa se há um pedido sendo rastreado (via URL ?track= ou localStorage)
  const trackParam = params.get("track");
  if (trackParam) {
    localStorage.setItem("qbombom_tracking", trackParam);
    rastreioAtual.value = trackParam;
    carregarRastreio();
    rastreioAberto.value = true;
    // Limpa o query param da URL sem recarregar
    window.history.replaceState({}, "", window.location.pathname);
  } else {
    const trackingAtivo = localStorage.getItem("qbombom_tracking");
    if (trackingAtivo) {
      rastreioAtual.value = trackingAtivo;
      carregarRastreio();
    }
  }

  // Conecta o socket se não estiver conectado (para o cliente receber updates)
  if (!socket.connected) {
    socket.connect();
  }

  // Socket escutando atualizações do backend (emissão global ou especifica)
  socket.on("orderUpdated", (updatedOrder) => {
    if (pedidoRastreado.value && updatedOrder.trackingCode === rastreioAtual.value) {
      const statusMudou = pedidoRastreado.value.status !== updatedOrder.status;
      const pagamentoMudou = pedidoRastreado.value.paymentStatus !== updatedOrder.paymentStatus;

      pedidoRastreado.value.status = updatedOrder.status;
      pedidoRastreado.value.paymentStatus = updatedOrder.paymentStatus;

      // Notificações Push nativas e Toasts de avanço só disparam se houve mudança de status real
      if (statusMudou) {
        if (updatedOrder.status === "em_preparo" || updatedOrder.status === "preparando") {
          toast.info("A cozinha começou a preparar seu pedido!");
          showNotification("Seu pedido está sendo preparado! 👨‍🍳", { body: "A cozinha acabou de começar a preparar o seu pedido." });
        } else if (updatedOrder.status === "em_rota" || updatedOrder.status === "caminho") {
          toast.success("O entregador saiu com o seu pedido!");
          showNotification("Seu pedido saiu para entrega! 🛵", { body: "O entregador já está a caminho do seu endereço." });
        } else if (updatedOrder.status === "pronto") {
          toast.success("Seu pedido está PRONTO! Pode vir retirar.");
          showNotification("Seu pedido está PRONTO! 🤩", { body: "Já pode vir retirar com a gente." });
        } else if (updatedOrder.status === "cancelado") {
          toast.info("Seu pedido foi cancelado.");
          showNotification("Pedido Cancelado", { body: "Seu pedido foi cancelado com sucesso." });
        } else if (updatedOrder.status === "entregue") {
          toast.success("Pedido entregue! Bom apetite 😋");
          showNotification("Pedido Entregue! 😋", { body: "Bom apetite! Agradecemos a preferência." });
        } else if (updatedOrder.status === "finalizado") {
          showNotification("Pedido Concluído! 🎉", { body: "Agradecemos a preferência. Até a próxima!" });
          limparRastreio();
        }
      }

      if (pagamentoMudou && updatedOrder.paymentStatus === "pago" && pedidoRastreado.value.paymentMethod === "PIX") {
        toast.success("Pagamento confirmado!");
        showNotification("Pagamento Recebido! ✅", { body: "Conferimos o seu comprovante PIX." });
      }
    }
  });
});

onUnmounted(() => {
  socket.off("orderUpdated");
  // É boa prática desconectar caso o cliente feche a tela do cardápio, para poupar o servidor
  socket.disconnect();
});

// Computeds Básicos
const termoBusca = ref("");

const todosProdutos = computed(() => {
  if (!Array.isArray(categorias.value)) return [];
  return categorias.value.flatMap((c) => c.products || []);
});

const totalProdutos = computed(() => todosProdutos.value.length);

const produtosFiltrados = computed(() => {
  if (!Array.isArray(categorias.value)) return [];
  const produtos = categoriaAtiva.value === null
    ? todosProdutos.value
    : (categorias.value.find((c) => c.id === categoriaAtiva.value)?.products || []);
  const termo = termoBusca.value.trim().toLowerCase();
  if (!termo) return produtos;
  return produtos.filter((p) => p.name.toLowerCase().includes(termo) || p.description?.toLowerCase().includes(termo));
});

const subtotal = computed(() => {
  return carrinho.value.reduce((acc, item) => acc + item.totalPrice * item.quantity, 0);
});

const precoMinimo = (produto) => {
  const prices = (produto.variations || []).map((v) => Number(v.price)).filter((p) => p > 0)
  if (prices.length === 0) return 'Ver opções'
  const min = Math.min(...prices)
  return prices.length > 1 ? `A partir de ${formatarMoeda(min)}` : formatarMoeda(min)
};

// --- Lógica do Produto (Modal) ---
const modalProduto = ref(false);
const produtoDetalhado = ref(null);
const loadingProdutoId = ref(null);

const abrirModalProduto = async (produtoSimples) => {
  loadingProdutoId.value = produtoSimples.id;
  try {
    const { data } = await CatalogService.getProduct(produtoSimples.id);
    produtoDetalhado.value = data;
    modalProduto.value = true;
  } catch (err) {
    console.error(err);
    toast.error("Falha ao carregar detalhes.");
  } finally {
    loadingProdutoId.value = null;
  }
};

// Lógica de Validação Adicionais (Reutilizada da view PDV, com foco no mobile)

const adicionarItemAoCarrinho = (item) => {
  carrinho.value.push(item);
  toast.success("Adicionado à sacola!");
  modalProduto.value = false;
};

// --- Lógica Sacola ---
const abrirSacola = () => {
  sacolaAberta.value = true;
};

const removerItem = (index) => {
  carrinho.value.splice(index, 1);
  if (carrinho.value.length === 0) sacolaAberta.value = false;
};

const enviarPedido = async () => {
  if (!podeFinalizarPedido.value) return;

  // Pede permissão para notificar o andamento antes de enviar o pedido
  await requestNotificationPermission();

  enviando.value = true;
  try {
    const finalCustomerName = checkout.value.nome;

    let obsAdicional = "";
    let endEntrega = "";

    if (checkout.value.tipo === "Entrega") {
      const end = checkout.value.endereco;
      endEntrega = `${end.rua}, ${end.numero} - ${end.bairro}`;
      if (end.complemento) {
        endEntrega += ` (${end.complemento})`;
      }

      if (checkout.value.pagamento === "Dinheiro") {
        if (checkout.value.precisaTroco) {
          obsAdicional = `Levar troco para ${checkout.value.trocoPara}`;
        } else {
          obsAdicional = `Sem troco`;
        }
      }
    }

    const payload = {
      type: checkout.value.tipo,
      customerName: finalCustomerName,
      customerPhone: limparTelefone(checkout.value.telefone),
      whatsappOptIn: Boolean(checkout.value.whatsappOptIn),
      deliveryAddress: endEntrega || undefined,
      paymentStatus: "pendente", // Pedido online nasce como pagamento pendente sempre
      paymentMethod: checkout.value.pagamento,
      subtotal: subtotal.value,
      discount: 0,
      total: subtotal.value,
      observation: obsAdicional || undefined,
      items: carrinho.value.map((item) => ({
        productId: item.productId,
        productVariationId: item.variationId || null,
        quantity: item.quantity,
        unitPrice: item.totalPrice, // preço unitário totalizado (incluindo adicionais)
        totalPrice: item.totalPrice * item.quantity,
        observation: item.observation,
        selectedAdditionals: item.selectedAdditionals,
      })),
    };

    // Usa a rota pública recém criada (não exige token)
    const response = await OrderService.createPublicOrder(payload);

    const trackingCode = response.data.trackingCode;
    if (trackingCode) {
      localStorage.setItem("qbombom_tracking", trackingCode);
      rastreioAtual.value = trackingCode;
      carregarRastreio();
    }

    // Sucesso UI
    checkoutEnviado.value = { ...checkout.value };
    subtotalEnviado.value = subtotal.value;
    pedidoCriado.value = response.data;

    salvarPedido(response.data, carrinho.value, checkout.value, subtotal.value)
    historico.value = getHistorico()

    sacolaAberta.value = false;
    telaSucesso.value = true;
    carrinho.value = [];

    // TODO: Se checkout.value.pagamento === 'PIX_ONLINE', devemos redirecionar
    // para uma nova tela de pagamento ou exibir o QR Code retornado pela API aqui mesmo.
    // Ex: if(response.data.pixQrCode) { qrCodePix.value = response.data.pixQrCode }
  } catch (err) {
    console.error(err);
    toast.error("Erro ao enviar pedido. Verifique a conexão.");
  } finally {
    enviando.value = false;
  }
};

const abrirAcompanhamento = () => {
  telaSucesso.value = false;
  rastreioAberto.value = true;
};

const fecharSucesso = () => {
  telaSucesso.value = false;
  checkout.value.nome = "";
  checkout.value.mesa = "";
};
</script>

<style scoped>
/* Esconde scrollbar no mobile */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animações Slide Up & Fade pra Mobile */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-in {
  animation: scale-in-bounce 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.scale-in-fast {
  animation: scale-in-bounce 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scale-in-bounce {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
