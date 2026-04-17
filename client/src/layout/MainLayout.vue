<template>
  <div class="flex h-screen bg-neutral-50 dark:bg-neutral-950 font-sans overflow-hidden">
    <!-- Sidebar Component -->
    <SidebarComp />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Header -->
      <header
        class="h-16 flex items-center justify-between px-8 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800"
      >
        <!-- Breadcrumb / Titulo da página (Exemplo) -->
        <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Painel de Controle
        </h2>

        <!-- Perfil do Usuário / Ações -->
        <div class="flex items-center gap-4">
          <button
            class="p-2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:bg-neutral-800"
          >
            <Bell class="w-6 h-6" />
          </button>

          <div
            class="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold border border-red-200 cursor-pointer"
          >
            M
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-8">
        <!-- O conteúdo das páginas filhas será injetado aqui pelo Vue Router -->
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import SidebarComp from '../components/layout/SidebarComp.vue'
import { Bell } from 'lucide-vue-next'
</script>
