<template>
  <div
    class="flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer group relative"
  >
    <div class="flex items-center gap-3">
      <!-- Ícone dinâmico -->
      <Sun v-if="colorMode === 'light'" class="w-5 h-5" />
      <Moon v-else-if="colorMode === 'dark'" class="w-5 h-5" />
      <Monitor v-else class="w-5 h-5" />
      <span class="font-medium text-sm transition-colors">Tema</span>
    </div>

    <select
      v-model="colorMode"
      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none z-10"
      title="Escolher Tema"
    >
      <option value="auto">Sistema</option>
      <option value="light">Claro</option>
      <option value="dark">Escuro</option>
    </select>

    <div
      class="flex items-center gap-1 text-xs font-semibold text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors"
    >
      <span class="capitalize">
        <template v-if="colorMode === 'auto'">Auto</template>
        <template v-else-if="colorMode === 'light'">Claro</template>
        <template v-else-if="colorMode === 'dark'">Escuro</template>
      </span>
      <ChevronDown class="w-3 h-3" />
    </div>
  </div>
</template>

<script setup>
import { useColorMode } from '@vueuse/core'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-vue-next'

// O VueUse gerencia 'light', 'dark' ou 'auto'. Ele injeta a classe 'dark' no <html> automaticamente.
const colorMode = useColorMode({ emitAuto: true })
</script>
