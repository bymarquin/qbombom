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
</script>
