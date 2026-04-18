<script setup>
import ToastContainer from "@/components/ToastContainer.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useDark } from "@vueuse/core";

const isDark = useDark();
</script>

<template>
  <div id="app" :class="{ dark: isDark }" class="bg-background text-foreground">
    <ToastContainer />
    <ConfirmDialog />
    <router-view />
  </div>
</template>
