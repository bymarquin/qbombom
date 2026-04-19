<template>
  <Transition name="fade">
    <div
      v-if="modelValue && produtoDetalhado"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <Transition name="slide-up" appear>
        <div class="flex flex-col bg-neutral-50 dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden relative">
          <header class="bg-white dark:bg-neutral-900 px-4 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0 sticky top-0 z-10 shadow-sm dark:shadow-none">
            <h2 class="font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate pr-4">
              Montar: {{ produtoDetalhado.name }}
            </h2>
            <button
              @click="fechar"
              class="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Fechar
            </button>
          </header>

          <main class="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
            <div v-if="produtoDetalhado.imageUrl" class="w-full h-72 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
              <img :src="produtoDetalhado.imageUrl" :alt="produtoDetalhado.name" class="w-full h-full object-cover" />
            </div>

            <p v-if="produtoDetalhado.description" class="text-sm text-neutral-500 dark:text-neutral-500">
              {{ produtoDetalhado.description }}
            </p>

            <!-- Stepper de bolas (sorvete) -->
            <section
              v-if="isSorvete"
              class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
            >
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex justify-between items-center text-sm tracking-tight">
                Bolas de Sorvete
                <span class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold border border-neutral-200 dark:border-neutral-800">
                  Obrigatório
                </span>
              </h3>
              <div class="flex items-center justify-between p-3 rounded-lg border border-red-600 ring-1 ring-red-600 bg-red-50/30 dark:bg-red-900/20">
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {{ bolaCount }} {{ bolaCount === 1 ? 'Bola' : 'Bolas' }}
                </span>
                <div class="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                  <button
                    @click="bolaCount > 1 && bolaCount--"
                    :disabled="bolaCount <= 1"
                    class="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-lg leading-none font-medium disabled:opacity-40"
                  >−</button>
                  <span class="px-3 text-sm font-bold text-neutral-900 dark:text-neutral-100 min-w-[2rem] text-center">{{ bolaCount }}</span>
                  <button
                    @click="bolaCount++"
                    class="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-lg leading-none font-medium"
                  >+</button>
                </div>
                <span class="text-sm font-bold text-red-600 dark:text-red-400">{{ formatarMoeda(bolaPrice) }}</span>
              </div>
              <p class="text-xs text-neutral-400 mt-2 ml-1">
                1ª bola R$4,00 • a partir da 2ª R$3,50/bola
              </p>
            </section>

            <!-- Produto por peso -->
            <section
              v-else-if="produtoDetalhado.weightBased"
              class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
            >
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex justify-between items-center text-sm tracking-tight">
                Valor (R$)
                <span class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold border border-neutral-200 dark:border-neutral-800">
                  Obrigatório
                </span>
              </h3>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">R$</span>
                <input
                  v-model.number="pesoGramas"
                  type="number"
                  :min="produtoDetalhado.minPrice || 0"
                  step="0.01"
                  placeholder="0,00"
                  class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
                />
              </div>
              <p v-if="pesoGramas > 0 && produtoDetalhado.pricePerKg > 0" class="text-sm font-bold text-red-600 dark:text-red-400 mt-3">
                ≈ {{ calcularPeso(pesoGramas, produtoDetalhado.pricePerKg) }}
              </p>
              <p v-if="produtoDetalhado.minPrice > 0" class="text-xs text-neutral-400 mt-2">
                Pedido mínimo: {{ formatarMoeda(produtoDetalhado.minPrice) }} • R${{ produtoDetalhado.pricePerKg }}/kg
              </p>
              <p v-if="pesoGramas > 0 && pesoGramas < produtoDetalhado.minPrice" class="text-xs text-red-500 mt-1 font-medium">
                Valor mínimo é {{ formatarMoeda(produtoDetalhado.minPrice) }}.
              </p>
            </section>

            <!-- Tamanhos normais -->
            <section
              v-else-if="produtoDetalhado.variations?.length > 0"
              class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
            >
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex justify-between items-center text-sm tracking-tight">
                Opções de Tamanho
                <span class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold border border-neutral-200 dark:border-neutral-800">
                  Obrigatório
                </span>
              </h3>

              <div class="flex flex-col gap-3">
                <label
                  v-for="tam in produtoDetalhado.variations"
                  :key="tam.id"
                  class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
                  :class="tamanhoSelecionado?.id === tam.id
                    ? 'border-red-600 bg-red-50/30 dark:bg-red-900/20 ring-1 ring-red-600'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'"
                >
                  <div class="flex items-center gap-3">
                    <input
                      type="radio"
                      :value="tam"
                      v-model="tamanhoSelecionado"
                      name="variations"
                      class="w-4 h-4 accent-red-600 dark:accent-red-500 cursor-pointer"
                    />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ tam.name }}</span>
                  </div>
                  <span
                    class="text-sm font-semibold"
                    :class="tamanhoSelecionado?.id === tam.id ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'"
                  >
                    {{ formatarMoeda(tam.price) }}
                  </span>
                </label>
              </div>

              <p v-if="!tamanhoSelecionado" class="text-xs text-red-600 dark:text-red-400 mt-3 font-medium ml-1">
                Selecione uma opção para continuar.
              </p>

              <div
                v-if="tamanhoSelecionado && limiteGlobal"
                class="mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <span class="text-xs text-neutral-500 dark:text-neutral-400">Complementos selecionados</span>
                <span class="text-xs font-bold" :class="atingiuLimite ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'">
                  {{ totalSelecionado }} / {{ limiteGlobal }}
                </span>
              </div>
            </section>

            <!-- Grupos de complementos -->
            <section
              v-for="grupo in produtoDetalhado.additionalGroups"
              :key="grupo.id"
              class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
            >
              <div class="mb-4 flex justify-between items-start">
                <h3 class="font-bold text-neutral-900 dark:text-neutral-100 text-sm tracking-tight">
                  {{ grupo.name }}
                </h3>
                <span
                  v-if="grupo.stepperMode"
                  class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold border border-neutral-200 dark:border-neutral-800"
                >
                  Opcional
                </span>
                <span
                  v-else-if="!isSaborGroup(grupo) && grupo.maxChoices === 1 && grupo.minChoices >= 1"
                  class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold border border-neutral-200 dark:border-neutral-800"
                >
                  Obrigatório
                </span>
                <span
                  v-else-if="grupo.minChoices > 0"
                  class="text-xs font-semibold px-2 py-1 rounded-md border"
                  :class="qtdSelecionadaNoGrupo(grupo.id) < minEfetivoGrupo(grupo)
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'"
                >
                  {{ qtdSelecionadaNoGrupo(grupo.id) }} / {{ minEfetivoGrupo(grupo) }}
                </span>
              </div>

              <!-- Stepper de casquinha -->
              <div v-if="grupo.stepperMode" class="flex flex-col gap-3">
                <div
                  v-for="add in grupo.items"
                  :key="add.id"
                  class="flex items-center justify-between p-3 rounded-lg border transition-all"
                  :class="(itemQuantidades[add.id] || 0) > 0
                    ? 'border-red-600 bg-red-50/30 dark:bg-red-900/20 ring-1 ring-red-600'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'"
                >
                  <div>
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ add.name }}</span>
                    <span class="text-xs text-neutral-400 ml-1.5">{{ formatarMoeda(add.price) }}/un</span>
                  </div>
                  <div class="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                    <button
                      @click="decrementarItem(add.id)"
                      :disabled="(itemQuantidades[add.id] || 0) === 0"
                      class="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-lg leading-none font-medium disabled:opacity-40"
                    >−</button>
                    <span class="px-3 text-sm font-bold text-neutral-900 dark:text-neutral-100 min-w-[2rem] text-center">{{ itemQuantidades[add.id] || 0 }}</span>
                    <button
                      @click="incrementarItem(add.id)"
                      class="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-lg leading-none font-medium"
                    >+</button>
                  </div>
                  <span class="text-sm font-bold w-14 text-right" :class="(itemQuantidades[add.id] || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-300 dark:text-neutral-600'">
                    {{ (itemQuantidades[add.id] || 0) > 0 ? formatarMoeda(add.price * (itemQuantidades[add.id] || 0)) : '—' }}
                  </span>
                </div>
              </div>

              <!-- Seleção única (radio style) -->
              <div v-else-if="!isSaborGroup(grupo) && grupo.maxChoices === 1 && grupo.minChoices >= 1" class="flex flex-col gap-3">
                <label
                  v-for="add in grupo.items"
                  :key="add.id"
                  class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
                  :class="isAdicionalSelecionado(add)
                    ? 'border-red-600 bg-red-50/30 dark:bg-red-900/20 ring-1 ring-red-600'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'"
                  @click="selecionarUnico(add, grupo)"
                >
                  <div class="flex items-center gap-3">
                    <input type="radio" :checked="isAdicionalSelecionado(add)" class="w-4 h-4 accent-red-600 dark:accent-red-500 cursor-pointer pointer-events-none" readonly />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ add.name }}</span>
                  </div>
                  <span v-if="add.price > 0" class="text-sm font-semibold" :class="isAdicionalSelecionado(add) ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'">
                    + {{ formatarMoeda(add.price) }}
                  </span>
                </label>
                <p v-if="grupo.minChoices > 0 && qtdSelecionadaNoGrupo(grupo.id) === 0" class="text-xs text-red-600 dark:text-red-400 font-medium ml-1">
                  Selecione uma opção para continuar.
                </p>
              </div>

              <!-- Múltipla escolha (checkbox) -->
              <div v-else class="flex flex-col gap-3">
                <label
                  v-for="add in grupo.items"
                  :key="add.id"
                  class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
                  :class="[
                    isAdicionalSelecionado(add)
                      ? 'border-red-600 bg-red-50/30 dark:bg-red-900/20 ring-1 ring-red-600'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700',
                    estaBloqueado(add, grupo) ? 'opacity-50 grayscale cursor-not-allowed' : ''
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      :value="{ ...add, grupoId: grupo.id }"
                      v-model="adicionaisSelecionados"
                      class="w-4 h-4 accent-red-600 dark:accent-red-500 rounded cursor-pointer"
                      :disabled="estaBloqueado(add, grupo)"
                    />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ add.name }}</span>
                  </div>
                  <span v-if="add.price > 0" class="text-sm font-semibold" :class="isAdicionalSelecionado(add) ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'">
                    + {{ formatarMoeda(add.price) }}
                  </span>
                </label>
              </div>
            </section>

            <!-- Observações -->
            <section class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50">
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 mb-3 text-sm tracking-tight">
                Observações
              </h3>
              <textarea
                v-model="observacaoProduto"
                rows="2"
                placeholder="Digite aqui se tiver alguma observação..."
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 resize-none"
              ></textarea>
            </section>
          </main>

          <footer class="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 shadow-sm dark:shadow-none">
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Qtd.</span>
                <div class="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                  <button
                    @click="quantidade = Math.max(1, quantidade - 1)"
                    class="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-lg leading-none font-medium"
                  >−</button>
                  <span class="px-3 text-sm font-bold text-neutral-900 dark:text-neutral-100 min-w-[2rem] text-center">{{ quantidade }}</span>
                  <button
                    @click="quantidade++"
                    class="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-lg leading-none font-medium"
                  >+</button>
                </div>
              </div>
              <span class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatarMoeda(totalItemAtual * quantidade) }}</span>
            </div>
            <button
              @click="confirmarItem"
              :disabled="!podeProsseguir || !isStoreOpen"
              class="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Adicionar à Sacola
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { formatarMoeda } from "@/utils/formatters";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();
const modelValue = defineModel({ type: Boolean, default: false });

const props = defineProps({
  produtoDetalhado: { type: Object, default: null },
  isStoreOpen: { type: Boolean, default: true }
});

const emit = defineEmits(['add-item']);

const tamanhoSelecionado = ref(null);
const adicionaisSelecionados = ref([]);
const observacaoProduto = ref("");
const quantidade = ref(1);
const bolaCount = ref(1);
const itemQuantidades = ref({});
const pesoGramas = ref(null);

watch(() => props.produtoDetalhado, () => {
  tamanhoSelecionado.value = null;
  adicionaisSelecionados.value = [];
  observacaoProduto.value = "";
  quantidade.value = 1;
  bolaCount.value = 1;
  itemQuantidades.value = {};
  pesoGramas.value = null;
});

const isWeightBased = computed(() => props.produtoDetalhado?.weightBased ?? false);

const calcularPeso = (preco, pricePerKg) => {
  const gramas = (preco / pricePerKg) * 1000;
  return gramas >= 1000 ? `${(gramas / 1000).toFixed(2).replace('.', ',')} kg` : `${Math.round(gramas)} g`;
};
const isSorvete = computed(() =>
  props.produtoDetalhado?.additionalGroups?.some(g => g.stepperMode) ?? false
);

const bolaPrice = computed(() =>
  bolaCount.value === 1 ? 4.00 : bolaCount.value * 3.50
);

const incrementarItem = (itemId) => {
  itemQuantidades.value = { ...itemQuantidades.value, [itemId]: (itemQuantidades.value[itemId] || 0) + 1 };
};
const decrementarItem = (itemId) => {
  const atual = itemQuantidades.value[itemId] || 0;
  if (atual > 0) itemQuantidades.value = { ...itemQuantidades.value, [itemId]: atual - 1 };
};

const casquinhaTotal = computed(() => {
  const grupo = props.produtoDetalhado?.additionalGroups?.find(g => g.stepperMode);
  if (!grupo) return 0;
  return grupo.items.reduce((acc, item) => acc + Number(item.price) * (itemQuantidades.value[item.id] || 0), 0);
});

const fechar = () => { modelValue.value = false; };

const limiteGlobal = computed(() => tamanhoSelecionado.value?.maxAdditionals ?? null);
const totalSelecionado = computed(() => {
  const gruposOpcionais = new Set(
    (props.produtoDetalhado?.additionalGroups ?? [])
      .filter(g => g.minChoices === 0 && !g.stepperMode)
      .map(g => g.id)
  );
  return adicionaisSelecionados.value.filter(a => gruposOpcionais.has(a.grupoId)).length;
});
const atingiuLimite = computed(() => limiteGlobal.value !== null && totalSelecionado.value >= limiteGlobal.value);

watch(bolaCount, (novo) => {
  if (!isSorvete.value) return;
  const gruposSabor = (props.produtoDetalhado?.additionalGroups ?? []).filter(g => !g.stepperMode && g.minChoices > 0);
  for (const g of gruposSabor) {
    const selecionados = itensSelecionadosNoGrupo(g.id);
    if (selecionados.length > novo) {
      const remover = new Set(selecionados.slice(novo).map(a => a.id));
      adicionaisSelecionados.value = adicionaisSelecionados.value.filter(a => !remover.has(a.id));
    }
  }
});

watch(tamanhoSelecionado, () => {
  const max = limiteGlobal.value;
  if (max !== null && adicionaisSelecionados.value.length > max) {
    adicionaisSelecionados.value = adicionaisSelecionados.value.slice(0, max);
  }
});

watch(totalSelecionado, (novo, anterior) => {
  if (limiteGlobal.value !== null && novo === limiteGlobal.value && novo > anterior) {
    toast.info('Máximo de complementos atingido!');
  }
});

const itensSelecionadosNoGrupo = (grupoId) =>
  adicionaisSelecionados.value.filter((a) => a.grupoId === grupoId);
const qtdSelecionadaNoGrupo = (grupoId) => itensSelecionadosNoGrupo(grupoId).length;
const isAdicionalSelecionado = (adicional) =>
  adicionaisSelecionados.value.some((a) => a.id === adicional.id);

const isSaborGroup = (grupo) => isSorvete.value && !grupo.stepperMode && grupo.minChoices > 0;
const maxEfetivoGrupo = (grupo) => isSaborGroup(grupo) ? bolaCount.value : grupo.maxChoices;
const minEfetivoGrupo = (grupo) => isSaborGroup(grupo) ? bolaCount.value : grupo.minChoices;

const estaBloqueado = (adicional, grupo) =>
  !isAdicionalSelecionado(adicional) && (atingiuLimite.value || qtdSelecionadaNoGrupo(grupo.id) >= maxEfetivoGrupo(grupo));

const selecionarUnico = (add, grupo) => {
  adicionaisSelecionados.value = adicionaisSelecionados.value.filter((a) => a.grupoId !== grupo.id);
  adicionaisSelecionados.value.push({ ...add, grupoId: grupo.id });
};

const podeProsseguir = computed(() => {
  if (!props.produtoDetalhado) return false;
  if (isWeightBased.value) {
    const min = Number(props.produtoDetalhado.minPrice) || 0;
    return pesoGramas.value > 0 && pesoGramas.value >= min;
  }
  if (!isSorvete.value && props.produtoDetalhado.variations?.length > 0 && !tamanhoSelecionado.value) return false;
  return props.produtoDetalhado.additionalGroups?.every(
    (grupo) => grupo.stepperMode || grupo.minChoices === 0 || qtdSelecionadaNoGrupo(grupo.id) >= minEfetivoGrupo(grupo)
  ) ?? true;
});

const adicionaisComPreco = computed(() => {
  if (!props.produtoDetalhado?.additionalGroups) return [];
  return props.produtoDetalhado.additionalGroups
    .filter(grupo => grupo.name !== 'Casquinha')
    .flatMap((grupo) => {
      const itens = [...itensSelecionadosNoGrupo(grupo.id)].sort((a, b) => Number(a.price) - Number(b.price));
      return itens.map((item, index) => ({
        id: item.id,
        name: item.name,
        price: index < grupo.freeChoices ? 0 : Number(item.price),
        grupoName: grupo.name,
      }));
    });
});

const totalItemAtual = computed(() => {
  if (!props.produtoDetalhado) return 0;
  if (isWeightBased.value) return (pesoGramas.value || 0) + adicionaisComPreco.value.reduce((acc, item) => acc + item.price, 0);
  const base = isSorvete.value
    ? bolaPrice.value
    : (tamanhoSelecionado.value ? Number(tamanhoSelecionado.value.price) : 0);
  return base + casquinhaTotal.value + adicionaisComPreco.value.reduce((acc, item) => acc + item.price, 0);
});

const confirmarItem = () => {
  if (!podeProsseguir.value) return;

  const casquinhaAdds = [];
  if (isSorvete.value) {
    const grupo = props.produtoDetalhado.additionalGroups?.find(g => g.name === 'Casquinha');
    grupo?.items.forEach(item => {
      const qty = itemQuantidades.value[item.id] || 0;
      if (qty > 0) casquinhaAdds.push({ id: item.id, name: `${item.name} ×${qty}`, price: Number(item.price) * qty });
    });
  }

  emit('add-item', {
    productId: props.produtoDetalhado.id,
    productName: props.produtoDetalhado.name,
    variationId: (isSorvete.value || isWeightBased.value) ? null : (tamanhoSelecionado.value?.id || null),
    variationName: isWeightBased.value
      ? `${pesoGramas.value}g`
      : isSorvete.value
        ? `${bolaCount.value} ${bolaCount.value === 1 ? 'Bola' : 'Bolas'}`
        : (tamanhoSelecionado.value?.name || ''),
    quantity: quantidade.value,
    selectedAdditionals: [...adicionaisComPreco.value, ...casquinhaAdds],
    observation: observacaoProduto.value,
    totalPrice: totalItemAtual.value,
  });

  fechar();
};
</script>
