<template>
  <main
    class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 font-sans"
  >
    <div
      class="w-full max-w-[420px] bg-white dark:bg-neutral-900 p-8 sm:p-10 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50"
    >
      <div class="text-center mb-8">
        <div class="flex justify-center mb-5">
          <!-- Placeholder da Logo Qbombom Sorvetes -->
          <svg
            width="48"
            height="48"
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
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight">
          Crie sua conta
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Preencha seus dados para se cadastrar no sistema.
        </p>
      </div>

      <form class="flex flex-col gap-5" @submit.prevent>
        <div class="flex flex-col gap-2">
          <label for="name" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >Nome completo</label
          >
          <input
            type="text"
            id="name"
            class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
            placeholder="Seu nome"
            autocomplete="name"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="email" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >E-mail</label
          >
          <input
            type="email"
            id="email"
            class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
            placeholder="voce@exemplo.com"
            autocomplete="email"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >Senha</label
          >
          <input
            type="password"
            id="password"
            class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <button
          type="submit"
          class="w-full py-3 mt-2 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none"
        >
          Cadastrar
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-500">
        <p>
          Já tem uma conta?
          <RouterLink
            to="/auth/login"
            class="text-red-600 font-medium hover:text-red-700 hover:underline transition-colors"
            >Entrar</RouterLink
          >
        </p>
      </div>
    </div>
  </main>
</template>

<script setup>
// Sem lógica no momento. Componente focado 100% na UI.
</script>
