<template>
  <div class="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 font-sans">
    <!-- Formulário -->
    <div class="w-full flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24">
      <div class="w-full max-w-[420px] mx-auto">
        <div class="flex items-center justify-center gap-3 mb-12">
          <!-- Logo Qbombom Sorvetes -->
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
            >Qbombom Sorvetes Sorvetes</span
          >
        </div>

        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight">
            Bem-vindo(a) de volta
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400">
            Acesso restrito para funcionários e gestão do estabelecimento.
          </p>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >E-mail de Acesso</label
            >
            <input
              v-model="email"
              type="email"
              id="email"
              class="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="voce@exemplo.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="flex flex-col gap-2 relative">
            <label for="password" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Senha</label
            >
            <div class="relative w-full">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                class="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 pr-12"
                placeholder="••••••••"
                autocomplete="current-password"
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
          </div>

          <div class="flex items-center justify-between text-sm mt-1">
            <label
              class="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <input
                type="checkbox"
                class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer"
              />
              <span>Lembrar de mim</span>
            </label>
            <RouterLink
              to="/auth/forgot-password"
              class="text-red-600 font-medium hover:text-red-700 hover:underline transition-colors"
            >
              Esqueceu a senha?
            </RouterLink>
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
            {{ loading ? "Acessando..." : "Acessar Sistema" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { AuthService } from "@/services/http";
import { useToastStore } from "@/stores/toast";
import { Eye, EyeOff } from "lucide-vue-next";

const router = useRouter();
const toast = useToastStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) return;

  loading.value = true;

  try {
    const { data } = await AuthService.login(email.value, password.value);

    // O backend devolve o role dentro de data.user.role
    const role = data.user?.role || "CASHIER";
    AuthService.setTokens(data.accessToken, data.refreshToken, role, data.user?.name);

    toast.success("Login realizado com sucesso!");

    // Redirecionamento Inteligente Dinâmico
    const nextRoute = AuthService.getDefaultRoute();
    router.push({ name: nextRoute });
  } catch (err) {
    const errorMessage =
      err.response?.data?.error || "Erro ao conectar com o servidor. Verifique suas credenciais.";
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>
