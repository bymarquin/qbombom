<template>
  <div
    class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none hover:shadow-red-900/5 transition-all duration-200 flex flex-col group"
  >
    <!-- Header do Pedido -->
    <div
      class="p-3.5 bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-start gap-2"
    >
      <div class="flex-1">
        <h3 class="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span
            class="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-mono text-xs font-semibold"
            >{{ pedido.trackingCode || `#${pedido.id.toString().substring(0, 6)}` }}</span
          >
          <span v-if="pedido.customerName" class="truncate max-w-[120px] text-sm">{{
            pedido.customerName
          }}</span>
          <span v-else class="text-neutral-500 dark:text-neutral-500 italic text-sm font-medium"
            >Sem nome</span
          >
        </h3>
        <p
          class="text-xs text-neutral-500 dark:text-neutral-500 mt-1 flex items-center gap-1 font-medium"
        >
          <Clock class="w-3.5 h-3.5 text-neutral-400" />
          {{ formatarTempo(pedido.createdAt) }}
        </p>
      </div>
      <span
        class="text-[10px] uppercase font-bold px-2 py-1 rounded shrink-0"
        :class="
          pedido.type === 'Mesa'
            ? 'bg-purple-50 text-purple-700 border border-purple-200'
            : 'bg-pink-50 text-pink-700 border border-pink-200'
        "
      >
        {{ pedido.type }}
      </span>
    </div>

    <!-- Lista de Itens -->
    <div class="p-4 flex-1">
      <ul class="space-y-3.5">
        <li v-for="item in pedido.items" :key="item.id" class="text-sm">
          <div class="flex items-start gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
            <span class="text-neutral-500 dark:text-neutral-500">{{ item.quantity }}x</span>
            <div class="flex-1 leading-snug">
              {{ item.product.name }}
              <span
                v-if="item.variation"
                class="text-neutral-500 dark:text-neutral-500 text-xs block font-medium mt-0.5"
                >{{ item.variation.name }}</span
              >
            </div>
          </div>

          <!-- Adicionais -->
          <ul
            v-if="item.selectedAdditionals && item.selectedAdditionals.length > 0"
            class="mt-1.5 pl-6 text-xs text-neutral-600 dark:text-neutral-400 list-disc marker:text-neutral-300 space-y-0.5 font-medium"
          >
            <li v-for="(add, i) in item.selectedAdditionals" :key="i">
              {{ add.name }}
            </li>
          </ul>

          <!-- Observação (Destacada na Cozinha) -->
          <div v-if="item.observation" class="mt-2 pl-6">
            <p
              class="text-xs bg-amber-50 text-amber-700 p-2 rounded-lg border border-amber-200 flex gap-1.5 leading-relaxed font-semibold"
            >
              <AlertTriangle class="w-4 h-4 shrink-0 text-amber-500" />
              {{ item.observation }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Botão de Ação -->
    <button
      @click="$emit('acao')"
      class="p-3.5 font-bold text-sm w-full transition-all duration-200 focus:outline-none uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.98]"
      :class="acaoCor"
    >
      {{ acaoTexto }}
    </button>
  </div>
</template>

<script setup>
import { Clock, AlertTriangle } from 'lucide-vue-next'

defineProps({
  pedido: { type: Object, required: true },
  acaoTexto: { type: String, required: true },
  acaoCor: { type: String, required: true },
})

defineEmits(['acao'])

const formatarTempo = (dateString) => {
  const agora = new Date()
  const pedidoData = new Date(dateString)
  const diffMs = agora - pedidoData
  const diffMinutos = Math.floor(diffMs / 60000)

  if (diffMinutos < 1) return 'Agora mesmo'
  if (diffMinutos === 1) return 'Há 1 minuto'
  if (diffMinutos < 60) return `Há ${diffMinutos} min`

  const diffHoras = Math.floor(diffMinutos / 60)
  if (diffHoras === 1) return 'Há 1 hora'
  return `Há ${diffHoras} horas`
}
</script>
