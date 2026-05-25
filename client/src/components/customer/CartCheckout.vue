<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <Transition name="slide-up" appear>
        <div class="flex flex-col bg-neutral-50 dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden relative">
          <header
            class="bg-white dark:bg-neutral-900 px-4 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0 sticky top-0 z-10 shadow-sm dark:shadow-none"
          >
        <h2
          class="font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2"
        >
          <ShoppingBag class="w-5 h-5 text-red-600" /> Minha Sacola
        </h2>
        <button
          @click="fechar"
          class="text-sm font-medium text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Fechar
        </button>
      </header>

      <main class="flex-1 overflow-y-auto p-4 pb-4">
        <div
          v-if="carrinho.length === 0"
          class="h-40 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-500 text-sm"
        >
          <p>Sua sacola está vazia.</p>
          <button
            @click="fechar"
            class="mt-4 text-red-600 dark:text-red-400 font-semibold hover:underline"
          >
            Voltar ao Cardápio
          </button>
        </div>

        <div v-else class="space-y-6">
          <div
            v-show="etapaAtual === 1"
            class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-2"
          >
            <div
              v-for="(item, index) in carrinho"
              :key="index"
              class="p-4 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 relative"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                    <span class="text-red-600 mr-1">{{ item.quantity }}x</span>
                    {{ item.productName }}
                  </h4>
                  <p v-if="item.variationName" class="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
                    {{ item.variationName }}
                  </p>
                </div>
                <span class="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{{
                  formatarMoeda(item.totalPrice * item.quantity)
                }}</span>
              </div>

              <div v-if="item.selectedAdditionals.length" class="mt-2 space-y-2">
                <div
                  v-for="(grupo, grupoNome) in agruparAdicionais(item.selectedAdditionals)"
                  :key="grupoNome"
                >
                  <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <span class="text-red-500">•</span> {{ grupoNome }}:
                  </p>
                  <ul class="mt-0.5 pl-3.5 space-y-0.5">
                    <li
                      v-for="(add, i) in grupo"
                      :key="i"
                      class="text-xs text-neutral-500 dark:text-neutral-400"
                    >
                      {{ add.name }}<span v-if="add.price > 0" class="text-red-500 dark:text-red-400 font-medium ml-1">+{{ formatarMoeda(add.price) }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p
                v-if="item.observation"
                class="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-2 rounded-lg mt-3"
              >
                <span class="font-medium">Obs:</span> {{ item.observation }}
              </p>

              <div class="flex justify-between items-center mt-4">
                <button
                  @click="emit('remover-item', index)"
                  class="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 hover:underline"
                >
                  <Trash2 class="w-3.5 h-3.5" /> Remover
                </button>
                <div
                  class="flex items-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                >
                  <button
                    class="px-3 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    @click="decrementarItem(index)"
                  >
                    -
                  </button>
                  <span
                    class="px-2 text-sm font-semibold w-6 text-center text-neutral-900 dark:text-neutral-100"
                    >{{ item.quantity }}</span
                  >
                  <button
                    class="px-3 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    @click="incrementarItem(index)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Dados do Cliente (Checkout) -->
          <div
            v-show="etapaAtual > 1"
            class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 p-5 space-y-5"
          >
            <div v-show="etapaAtual === 2" class="space-y-4">
              <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Seu Nome (Como ser chamado)</label
              >
              <input
                v-model="checkout.nome"
                type="text"
                placeholder="Ex: Maria"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
              </div>

              <div class="flex flex-col gap-2 mt-4">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >WhatsApp / Telefone</label
              >
              <input
                :value="checkout.telefone"
                @input="checkout.telefone = mascararTelefone($event.target.value)"
                type="tel"
                inputmode="numeric"
                placeholder="(00) 00000-0000"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />

              <label class="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                <input
                  v-model="checkout.whatsappOptIn"
                  type="checkbox"
                  class="mt-0.5 accent-red-600 w-4 h-4"
                />
                <span>
                  Quero receber atualizações do pedido no WhatsApp. Posso desativar depois no rastreio.
                </span>
              </label>
              </div>
            </div>

            <div v-show="etapaAtual === 3" class="space-y-4">
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Escolha como quer receber o pedido.
              </p>
              <div class="space-y-2">
              <p class="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Como deseja receber?</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  @click="checkout.tipo = 'Mesa'"
                  class="p-3 rounded-xl border text-left transition-all duration-200"
                  :class="checkout.tipo === 'Mesa' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500/30' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600'"
                >
                  <p class="text-sm font-bold text-neutral-900 dark:text-neutral-100">Mesa</p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Consumir no local</p>
                </button>
                <button
                  @click="checkout.tipo = 'Viagem'"
                  class="p-3 rounded-xl border text-left transition-all duration-200"
                  :class="checkout.tipo === 'Viagem' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500/30' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600'"
                >
                  <p class="text-sm font-bold text-neutral-900 dark:text-neutral-100">Levar</p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Retirar no balcão</p>
                </button>
                <button
                  @click="checkout.tipo = 'Entrega'"
                  class="p-3 rounded-xl border text-left transition-all duration-200"
                  :class="checkout.tipo === 'Entrega' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500/30' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600'"
                >
                  <p class="text-sm font-bold text-neutral-900 dark:text-neutral-100">Entrega</p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Receber em casa</p>
                </button>
              </div>
              </div>

              <div v-if="checkout.tipo === 'Mesa'" class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Nº da Mesa (Opcional)</label
              >
              <input
                v-model="checkout.mesa"
                :readonly="Boolean(mesaDoQr)"
                type="text"
                placeholder="Mesa 04"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
              <p
                v-if="mesaDoQr"
                class="text-[11px] text-neutral-500 dark:text-neutral-400"
              >
                Mesa identificada via QR: <span class="font-semibold">{{ mesaDoQr }}</span>
              </p>
              </div>

              <div v-if="checkout.tipo === 'Entrega'" class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-bold text-neutral-900 dark:text-neutral-100">Endereço de Entrega</label>
                <button
                  type="button"
                  @click="usarLocalizacaoAtual"
                  :disabled="buscandoLocalizacao"
                  class="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Loader2 v-if="buscandoLocalizacao" class="w-3.5 h-3.5 animate-spin" />
                  <MapPin v-else class="w-3.5 h-3.5" />
                  {{ buscandoLocalizacao ? 'Buscando...' : 'Usar minha localização' }}
                </button>
              </div>
              <input
                v-model="checkout.endereco.rua"
                type="text"
                placeholder="Rua / Avenida"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="checkout.endereco.numero"
                  type="text"
                  placeholder="Número"
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                />
                <input
                  v-model="checkout.endereco.bairro"
                  type="text"
                  placeholder="Bairro"
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                />
              </div>
              <input
                v-model="checkout.endereco.complemento"
                type="text"
                placeholder="Complemento / Ponto de Referência"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
              </div>
            </div>

            <div v-show="etapaAtual === 4" class="space-y-4">
              <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Forma de Pagamento</label
              >
              <select
                v-model="checkout.pagamento"
                class="w-full h-[42px] px-3.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 cursor-pointer dark:[color-scheme:dark]"
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
              </div>

              <div v-if="checkout.pagamento === 'Dinheiro'" class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Precisa de troco?</label
              >
              <div class="flex items-center gap-3">
                <label
                  class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                >
                  <input
                    type="radio"
                    :value="false"
                    v-model="checkout.precisaTroco"
                    class="accent-red-600 w-4 h-4"
                  />
                  Não
                </label>
                <label
                  class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                >
                  <input
                    type="radio"
                    :value="true"
                    v-model="checkout.precisaTroco"
                    class="accent-red-600 w-4 h-4"
                  />
                  Sim
                </label>
              </div>
              <input
                v-if="checkout.precisaTroco"
                v-model="checkout.trocoPara"
                type="number"
                placeholder="Troco para quanto? (Ex: 50)"
                class="w-full px-3.5 py-2.5 mt-1 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
              />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        v-if="carrinho.length > 0"
        class="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 shadow-sm dark:shadow-none"
      >
        <div class="flex justify-between items-center mb-3">
          <div class="w-full space-y-1.5">
            <div class="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
              <span>Subtotal</span>
              <span>{{ formatarMoeda(subtotal) }}</span>
            </div>
            <div
              v-if="deliveryFee > 0"
              class="flex justify-between text-sm text-neutral-700 dark:text-neutral-300"
            >
              <span>Taxa de entrega</span>
              <span>{{ formatarMoeda(deliveryFee) }}</span>
            </div>
            <div
              v-if="serviceFee > 0"
              class="flex justify-between text-sm text-neutral-700 dark:text-neutral-300"
            >
              <span>Taxa de serviço</span>
              <span>{{ formatarMoeda(serviceFee) }}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-neutral-200 dark:border-neutral-800">
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total a pagar</span>
              <span class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatarMoeda(total) }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="etapaAtual > 1"
            type="button"
            @click="voltarEtapa"
            class="py-3 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm font-semibold transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Voltar
          </button>
          <button
            v-if="etapaAtual < 4"
            type="button"
            @click="proximaEtapa"
            :disabled="!etapaPodeAvancar"
            class="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {{ labelContinuar }}
          </button>
          <button
            v-else
            @click="emit('enviar-pedido')"
            :disabled="!podeFinalizarPedido || enviando || !isStoreOpen"
            class="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <div
              v-if="enviando"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
            {{ enviando ? "Enviando Pedido..." : "Finalizar Pedido" }}
          </button>
        </div>
        <p
          v-if="etapaAtual === 2 && !dadosValidos"
          class="text-center text-xs text-red-600 dark:text-red-400 mt-2 font-medium"
        >
          Preencha seus dados para continuar.
        </p>
        <p
          v-else-if="etapaAtual === 3 && !checkout.tipo"
          class="text-center text-xs text-red-600 dark:text-red-400 mt-2 font-medium"
        >
          Escolha como deseja receber: Mesa, Levar ou Entrega.
        </p>
        <p
          v-else-if="etapaAtual === 3 && itensIncompativeis.length > 0"
          class="text-center text-xs text-red-600 dark:text-red-400 mt-2 font-medium"
        >
          {{ itensIncompativeis.map(i => i.productName).join(', ') }}
          {{ itensIncompativeis.length === 1 ? 'não está disponível' : 'não estão disponíveis' }}
          para {{ checkout.tipo === 'Entrega' ? 'entrega' : 'viagem' }}.
        </p>
        <p
          v-else-if="
            etapaAtual === 3 &&
            checkout.tipo === 'Entrega' &&
            (!checkout.endereco.rua || !checkout.endereco.numero || !checkout.endereco.bairro)
          "
          class="text-center text-xs text-red-600 dark:text-red-400 mt-2 font-medium"
        >
          Preencha Rua, Número e Bairro.
        </p>
      </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { ShoppingBag, Trash2, MapPin, Loader2 } from "lucide-vue-next";
import { formatarMoeda, mascararTelefone } from "@/utils/formatters";
import { GeocodeService } from "@/services/http";

const isOpen = defineModel("isOpen", { type: Boolean, required: true });
const carrinho = defineModel("carrinho", { type: Array, required: true });
const checkout = defineModel("checkout", { type: Object, required: true });

const props = defineProps({
  subtotal: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    default: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  podeFinalizarPedido: {
    type: Boolean,
    required: true,
  },
  enviando: {
    type: Boolean,
    required: true,
  },
  isStoreOpen: {
    type: Boolean,
    default: true,
  },
  mesaDoQr: {
    type: String,
    default: null,
  },
  itensIncompativeis: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["remover-item", "enviar-pedido"]);

const etapaAtual = ref(1);

const dadosValidos = computed(() => Boolean(checkout.value.nome && checkout.value.telefone));
const entregaValida = computed(() => {
  if (!checkout.value.tipo) return false;
  if (props.itensIncompativeis.length > 0) return false;
  if (checkout.value.tipo !== 'Entrega') return true;
  return Boolean(checkout.value.endereco.rua && checkout.value.endereco.numero && checkout.value.endereco.bairro);
});

const etapaPodeAvancar = computed(() => {
  if (etapaAtual.value === 1) return carrinho.value.length > 0;
  if (etapaAtual.value === 2) return dadosValidos.value;
  if (etapaAtual.value === 3) return entregaValida.value;
  return true;
});

const labelContinuar = computed(() => {
  if (etapaAtual.value === 1) return 'Continuar para dados';
  if (etapaAtual.value === 2) return 'Continuar para recebimento';
  return 'Continuar para pagamento';
});

const proximaEtapa = () => {
  if (!etapaPodeAvancar.value) return;
  if (etapaAtual.value < 4) etapaAtual.value += 1;
};

const voltarEtapa = () => {
  if (etapaAtual.value > 1) etapaAtual.value -= 1;
};

const fechar = () => {
  isOpen.value = false;
};

watch(isOpen, (opened) => {
  if (opened) etapaAtual.value = 1;
});

watch(() => checkout.value.tipo, (tipo) => {
  if (etapaAtual.value !== 3) return;
  if (tipo === 'Mesa' || tipo === 'Viagem') {
    etapaAtual.value = 4;
  }
});

const agruparAdicionais = (adicionais) => {
  return adicionais.reduce((acc, add) => {
    const grupo = add.grupoName || 'Adicionais';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(add);
    return acc;
  }, {});
};

const decrementarItem = (index) => {
  const item = carrinho.value[index];
  if (item.quantity > 1) {
    const novoCarrinho = [...carrinho.value];
    novoCarrinho[index].quantity--;
    carrinho.value = novoCarrinho;
  }
};

const incrementarItem = (index) => {
  const novoCarrinho = [...carrinho.value];
  novoCarrinho[index].quantity++;
  carrinho.value = novoCarrinho;
};

const buscandoLocalizacao = ref(false);

const usarLocalizacaoAtual = () => {
  if (!navigator.geolocation) return;

  buscandoLocalizacao.value = true;

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const { data } = await GeocodeService.reverseGeocode(coords.latitude, coords.longitude);
        const addr = data.address || {};
        checkout.value.endereco.rua = addr.road || addr.pedestrian || '';
        checkout.value.endereco.bairro = addr.suburb || addr.city_district || addr.neighbourhood || '';
      } finally {
        buscandoLocalizacao.value = false;
      }
    },
    () => {
      buscandoLocalizacao.value = false;
    },
  );
};
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
