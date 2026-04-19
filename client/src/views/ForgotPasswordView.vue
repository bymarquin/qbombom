<template>
  <div class="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 font-sans">
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
          <div class="flex flex-col leading-none">
            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">Qbombom</span>
            <span class="text-sm font-medium text-neutral-500 dark:text-neutral-400 -mt-0.5">Sorvetes</span>
          </div>
        </div>

        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight">
            Esqueceu sua senha?
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400">
            Digite seu e-mail associado à conta e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="handleForgot">
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >E-mail</label
            >
            <input
              type="email"
              id="email"
              v-model="email"
              class="w-full px-4 py-3 text-sm border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="voce@exemplo.com"
              autocomplete="email"
              required
            />
          </div>

          <div
            v-if="successMsg"
            class="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 text-center"
          >
            {{ successMsg }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 mt-4 bg-red-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 v-if="loading" class="animate-spin h-5 w-5" />
            {{ loading ? "Enviando..." : "Enviar instruções" }}
          </button>
        </form>

        <div class="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-500">
          <RouterLink
            to="/auth/login"
            class="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400 font-medium hover:text-red-600 transition-colors"
          >
            <ArrowLeft class="h-4 w-4" />
            Voltar para o login
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Loader2, ArrowLeft } from "lucide-vue-next";
import { AuthService } from "@/services/http";
import { useToastStore } from "@/stores/toast";

const email = ref("");
const loading = ref(false);
const successMsg = ref("");
const toast = useToastStore();

const handleForgot = async () => {
  if (!email.value) return;

  loading.value = true;
  successMsg.value = "";

  try {
    await AuthService.forgotPassword(email.value);
    toast.success("Se o email existir, você receberá um link de recuperação em instantes.");
  } catch (error) {
    console.error(error);
    toast.error("Ocorreu um erro ao solicitar a recuperação de senha");
  } finally {
    loading.value = false;
  }
};
</script>
