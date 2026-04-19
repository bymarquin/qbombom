<template>
  <div
    v-if="images.length > 0"
    class="relative overflow-hidden select-none"
    :class="containerClass"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <!-- Images -->
    <div
      class="flex transition-transform duration-300 ease-out h-full"
      :style="{ transform: `translateX(-${current * 100}%)` }"
    >
      <div
        v-for="(img, i) in images"
        :key="i"
        class="w-full h-full shrink-0"
      >
        <img
          :src="img"
          :alt="`Imagem ${i + 1}`"
          class="w-full h-full object-cover"
          draggable="false"
        />
      </div>
    </div>

    <!-- Prev / Next — só aparecem se mais de 1 imagem -->
    <template v-if="images.length > 1">
      <button
        @click.stop="prev"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-opacity"
        :class="showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <button
        @click.stop="next"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-opacity"
        :class="showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <!-- Dots -->
      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        <button
          v-for="(_, i) in images"
          :key="i"
          @click.stop="current = i"
          class="rounded-full transition-all duration-200"
          :class="current === i
            ? 'w-4 h-1.5 bg-white'
            : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  images: { type: Array, default: () => [] },
  containerClass: { type: String, default: '' },
  showControls: { type: Boolean, default: false },
  autoplay: { type: Number, default: 0 },
})

const current = ref(0)

const prev = () => { current.value = (current.value - 1 + props.images.length) % props.images.length }
const next = () => { current.value = (current.value + 1) % props.images.length }

let timer = null

const startAutoplay = () => {
  if (!props.autoplay || props.images.length <= 1) return
  timer = setInterval(next, props.autoplay)
}

const stopAutoplay = () => {
  if (timer) { clearInterval(timer); timer = null }
}

onMounted(startAutoplay)
onUnmounted(stopAutoplay)

let touchStartX = 0
const onTouchStart = (e) => { touchStartX = e.touches[0].clientX; stopAutoplay() }
const onTouchEnd = (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 40) {
    if (diff > 0) next()
    else prev()
  }
  startAutoplay()
}
</script>
