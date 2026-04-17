<template>
  <Transition name="fade">
    <div
      v-if="modelValue && produtoDetalhado"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <Transition name="slide-up" appear>
        <div class="flex flex-col bg-neutral-50 dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden relative">
          <header
            class="bg-white dark:bg-neutral-900 px-4 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0 sticky top-0 z-10 shadow-sm dark:shadow-none"
          >
        <h2 class="font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate pr-4">
          Montar: {{ produtoDetalhado.name }}
        </h2>
        <button
          @click="fecharModalProduto"
          class="w-8 h-8 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </header>

      <main class="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        <div v-if="produtoDetalhado.imageUrl" class="w-full h-72 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <img :src="produtoDetalhado.imageUrl" :alt="produtoDetalhado.name" class="w-full h-full object-cover" />
        </div>
        <p v-if="produtoDetalhado.description" class="text-sm text-neutral-500 dark:text-neutral-500">
          {{ produtoDetalhado.description }}
        </p>

        <!-- Variações -->
        <section
          v-if="produtoDetalhado.variations && produtoDetalhado.variations.length > 0"
          class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
        >
          <h3
            class="font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex justify-between items-center text-sm tracking-tight"
          >
            Opções de Tamanho
            <span
              class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase px-2 py-0.5 rounded font-bold border border-neutral-200 dark:border-neutral-800"
              >Obrigatório</span
            >
          </h3>
          <div class="flex flex-col gap-3">
            <label
              v-for="tam in produtoDetalhado.variations"
              :key="tam.id"
              class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
              :class="
                tamanhoSelecionado?.id === tam.id
                  ? 'border-red-600 bg-red-50/30 dark:bg-red-900/20 ring-1 ring-red-600'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
              "
            >
              <div class="flex items-center gap-3">
                <input
                  type="radio"
                  :value="tam"
                  v-model="tamanhoSelecionado"
                  name="variations"
                  class="w-4 h-4 text-red-600 accent-red-600 dark:accent-red-500 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 cursor-pointer focus:ring-red-600 focus:ring-2"
                />
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{
                  tam.name
                }}</span>
              </div>
              <span
                class="text-sm font-semibold"
                :class="
                  tamanhoSelecionado?.id === tam.id
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-900 dark:text-neutral-100'
                "
              >
                {{ formatarMoeda(tam.price) }}
              </span>
            </label>
          </div>
          <p v-if="!tamanhoSelecionado" class="text-xs text-red-600 dark:text-red-400 mt-3 font-medium ml-1">
            Selecione uma opção para continuar.
          </p>
        </section>

        <!-- Adicionais -->
        <section
          v-for="grupo in produtoDetalhado.additionalGroups"
          :key="grupo.id"
          class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
        >
          <div class="mb-4 flex justify-between items-start">
            <div>
              <h3 class="font-bold text-neutral-900 dark:text-neutral-100 text-sm tracking-tight">
                {{ grupo.name }}
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                <span v-if="grupo.minChoices > 0">Mín: {{ grupo.minChoices }}</span>
                <span v-if="grupo.minChoices > 0 && grupo.maxChoices > 0"> • </span>
                Máx: {{ maxEfetivoDoGrupo(grupo) }}
                <span v-if="grupo.freeChoices > 0" class="text-red-600 dark:text-red-400 font-medium">
                  • ({{ grupo.freeChoices }} grátis)</span
                >
              </p>
            </div>
            <span
              class="text-xs font-semibold px-2 py-1 rounded-md border"
              :class="
                qtdSelecionadaNoGrupo(grupo.id) < grupo.minChoices
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
              "
            >
              {{ qtdSelecionadaNoGrupo(grupo.id) }} / {{ maxEfetivoDoGrupo(grupo) }}
            </span>
          </div>

          <div class="flex flex-col gap-3">
            <label
              v-for="add in grupo.items"
              :key="add.id"
              class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
              :class="[
                isAdicionalSelecionado(add)
                  ? 'border-red-600 bg-red-50/30 dark:bg-red-900/20 ring-1 ring-red-600'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700',
                !isAdicionalSelecionado(add) && atingiuMaximo(grupo)
                  ? 'opacity-50 grayscale cursor-not-allowed'
                  : '',
              ]"
            >
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  :value="{ ...add, grupoId: grupo.id }"
                  v-model="adicionaisSelecionados"
                  class="w-4 h-4 text-red-600 accent-red-600 dark:accent-red-500 bg-white dark:bg-neutral-900 rounded border-neutral-300 dark:border-neutral-700 cursor-pointer focus:ring-red-600 focus:ring-2"
                  :disabled="!isAdicionalSelecionado(add) && atingiuMaximo(grupo)"
                />
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{
                  add.name
                }}</span>
              </div>
              <span
                v-if="add.price > 0"
                class="text-sm font-semibold"
                :class="
                  isAdicionalSelecionado(add)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-900 dark:text-neutral-100'
                "
              >
                + {{ formatarMoeda(add.price) }}
              </span>
            </label>
          </div>
        </section>

        <!-- Observações -->
        <section
          class="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
        >
          <h3
            class="font-bold text-neutral-900 dark:text-neutral-100 mb-3 text-sm tracking-tight"
          >
            Observações
          </h3>
          <textarea
            v-model="observacaoProduto"
            rows="2"
            placeholder="Ex: Tirar cebola, calda à parte..."
            class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 resize-none"
          ></textarea>
        </section>
      </main>

      <footer
        class="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 shadow-sm dark:shadow-none z-20 absolute bottom-0 w-full"
      >
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >Total do item</span
          >
          <span class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatarMoeda(totalItemAtual) }}</span>
        </div>
        <button
          @click="confirmarItem"
          :disabled="podeConfirmarProduto === false || !isStoreOpen"
          class="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
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
import { X } from "lucide-vue-next";
import { formatarMoeda } from "@/utils/formatters";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

const modelValue = defineModel({ type: Boolean, default: false });

const props = defineProps({
  produtoDetalhado: {
    type: Object,
    default: null
  },
  isStoreOpen: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['add-item']);

const tamanhoSelecionado = ref(null);
const adicionaisSelecionados = ref([]);
const observacaoProduto = ref("");

watch(() => props.produtoDetalhado, () => {
  tamanhoSelecionado.value = null;
  adicionaisSelecionados.value = [];
  observacaoProduto.value = "";
});

watch(tamanhoSelecionado, () => {
  if (!props.produtoDetalhado?.additionalGroups) return;
  for (const grupo of props.produtoDetalhado.additionalGroups) {
    const max = maxEfetivoDoGrupo(grupo);
    const selecionados = itensSelecionadosNoGrupo(grupo.id);
    if (selecionados.length > max) {
      const excesso = selecionados.slice(max).map((i) => i.id);
      adicionaisSelecionados.value = adicionaisSelecionados.value.filter(
        (a) => !excesso.includes(a.id)
      );
    }
  }
});

const fecharModalProduto = () => {
  modelValue.value = false;
};

// Lógica de Validação Adicionais
const itensSelecionadosNoGrupo = (grupoId) =>
  adicionaisSelecionados.value.filter((a) => a.grupoId === grupoId);
const qtdSelecionadaNoGrupo = (grupoId) => itensSelecionadosNoGrupo(grupoId).length;
const isAdicionalSelecionado = (adicional) =>
  adicionaisSelecionados.value.some((a) => a.id === adicional.id);
const maxEfetivoDoGrupo = (grupo) => {
  const limiteVariacao = tamanhoSelecionado.value?.maxAdditionals
  const todosGratis = grupo.items?.every((i) => parseFloat(i.price) === 0)
  return limiteVariacao && todosGratis ? limiteVariacao : grupo.maxChoices
}
const atingiuMaximo = (grupo) => qtdSelecionadaNoGrupo(grupo.id) >= maxEfetivoDoGrupo(grupo);

const podeConfirmarProduto = computed(() => {
  if (!props.produtoDetalhado) return false;
  if (props.produtoDetalhado.variations?.length > 0 && !tamanhoSelecionado.value) return false;
  if (props.produtoDetalhado.additionalGroups) {
    for (const grupo of props.produtoDetalhado.additionalGroups) {
      if (grupo.minChoices > 0 && qtdSelecionadaNoGrupo(grupo.id) < grupo.minChoices) return false;
    }
  }
  return true;
});

const adicionaisComPrecoCalculado = computed(() => {
  if (!props.produtoDetalhado?.additionalGroups) return [];
  const processados = [];

  for (const grupo of props.produtoDetalhado.additionalGroups) {
    const itens = [...itensSelecionadosNoGrupo(grupo.id)].sort(
      (a, b) => Number(a.price) - Number(b.price),
    );
    itens.forEach((item, index) => {
      const precoCalculado = index < grupo.freeChoices ? 0 : Number(item.price);
      processados.push({ id: item.id, name: item.name, price: precoCalculado });
    });
  }
  return processados;
});

const totalItemAtual = computed(() => {
  if (!props.produtoDetalhado) return 0;
  const base = tamanhoSelecionado.value
    ? Number(tamanhoSelecionado.value.price)
    : Number(props.produtoDetalhado.basePrice);
  const extras = adicionaisComPrecoCalculado.value.reduce((acc, curr) => acc + curr.price, 0);
  return base + extras;
});

const confirmarItem = () => {
  if (!podeConfirmarProduto.value) return;

  emit('add-item', {
    productId: props.produtoDetalhado.id,
    productName: props.produtoDetalhado.name,
    variationId: tamanhoSelecionado.value?.id || null,
    variationName: tamanhoSelecionado.value?.name || "",
    quantity: 1,
    selectedAdditionals: [...adicionaisComPrecoCalculado.value],
    observation: observacaoProduto.value,
    totalPrice: totalItemAtual.value,
  });

  toast.success("Adicionado à sacola!");
  fecharModalProduto();
};
</script>