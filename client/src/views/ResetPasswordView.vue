<template>
  <div class="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 font-sans">
    <div class="w-full flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24">
      <div class="w-full max-w-[420px] mx-auto">
        <div class="flex items-center justify-center gap-3 mb-12">
          <!-- Logo QbomBom -->
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
          <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100"
            >QbomBom</span
          >
        </div>

        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight">
            Criar nova senha
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400">
            Sua nova senha deve ser diferente das senhas usadas anteriormente.
          </p>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="handleReset">
          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Nova senha</label
            >
            <div class="relative w-full">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="password"
                class="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 pr-12"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              A senha deve ter pelo menos 8 caracteres.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password_confirm"
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Confirme a nova senha</label
            >
            <div class="relative w-full">
              <input
                :type="showPasswordConfirm ? 'text' : 'password'"
                id="password_confirm"
                v-model="passwordConfirm"
                class="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 pr-12"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />
              <button
                type="button"
                @click="showPasswordConfirm = !showPasswordConfirm"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none"
              >
                <Eye v-if="!showPasswordConfirm" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 mt-4 bg-red-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="loading"
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ loading ? "Redefinindo..." : "Redefinir senha" }}
          </button>
        </form>

        <div class="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-500">
          <RouterLink
            to="/auth/login"
            class="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400 font-medium hover:text-red-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o login
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { Eye, EyeOff } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const loading = ref(false)

const handleReset = async () => {
  if (password.value.length < 8) {
    return toast.error('A senha deve ter pelo menos 8 caracteres.')
  }
  
  if (password.value !== passwordConfirm.value) {
    return toast.error('As senhas não coincidem.')
  }

  const { id, token } = route.query
  if (!id || !token) {
    return toast.error('Link de recuperação inválido ou ausente.')
  }

  loading.value = true

  try {
    await AuthService.resetPassword(id, token, password.value)
    toast.success('Senha redefinida com sucesso! Faça login.')
    router.push('/auth/login')
  } catch (error) {
    console.error(error)
    // O erro genérico já é tratado pelo interceptor e exibido em um toast
  } finally {
    loading.value = false
  }
}
</script>
