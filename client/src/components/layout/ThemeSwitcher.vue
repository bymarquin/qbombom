<template>
  <div class="flex items-center gap-2 px-3 py-2 rounded-lg">
    <Monitor class="w-4 h-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
    <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300 flex-1">Tema</span>
    <div class="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-0.5">
      <button
        v-for="opt in options"
        :key="opt.value"
        @click="colorMode = opt.value"
        :title="opt.label"
        :class="[
          'p-1.5 rounded-md transition-colors',
          colorMode === opt.value
            ? 'bg-white dark:bg-neutral-600 text-red-600 dark:text-red-400 shadow-sm'
            : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
        ]"
      >
        <component :is="opt.icon" class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { useColorMode } from '@vueuse/core'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

const colorMode = useColorMode({ emitAuto: true })

const options = [
  { value: 'auto', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
]
</script>
