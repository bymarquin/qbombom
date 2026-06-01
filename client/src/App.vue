<script setup>
import ToastContainer from "@/components/ToastContainer.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useDark } from "@vueuse/core";
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { initGlobalBarcodeScanner } from "@/composables/useBarcodeScanner";

const isDark = useDark();
const router = useRouter();

let destroyScanner;
onMounted(() => { destroyScanner = initGlobalBarcodeScanner(router) });
onUnmounted(() => destroyScanner?.());
</script>

<template>
  <div id="app" :class="{ dark: isDark }" class="bg-background text-foreground">
    <ToastContainer />
    <ConfirmDialog />
    <router-view />
  </div>
</template>
