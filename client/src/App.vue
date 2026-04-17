<script setup>
import ToastContainer from "@/components/ToastContainer.vue";
import { useDark } from "@vueuse/core";

const isDark = useDark();
</script>

<template>
  <div id="app" :class="{ dark: isDark }" class="bg-background text-foreground">
    <ToastContainer />
    <router-view />
  </div>
</template>
