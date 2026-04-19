<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          {{ isEditing ? 'Editar Produto' : 'Novo Produto' }}
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          {{ isEditing ? 'Altere os dados do produto.' : 'Preencha os dados para criar um novo produto.' }}
        </p>
      </div>
      <RouterLink
        to="/app/produtos"
        class="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 self-start sm:self-auto"
      >
        Voltar
      </RouterLink>
    </header>

    <div class="flex-1 overflow-y-auto">
      <form @submit.prevent="saveProduct" class="w-full flex flex-col gap-5 pb-8">

        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-5">
          <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Informações básicas</h2>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome do Produto</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="Ex: Açaí 300ml"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Descrição</label>
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 resize-none"
              placeholder="Ingredientes e detalhes..."
            ></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoria</label>
            <select
              v-model="form.categoryId"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 cursor-pointer"
            >
              <option disabled value="">Selecione...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <input v-model="form.status" id="prod-status" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <label for="prod-status" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Produto Ativo</label>
          </div>
        </div>

        <!-- Imagem -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Imagem</h2>
            <button
              v-if="imagePreview"
              type="button"
              @click="imagePreview = null; imageBase64 = null"
              class="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Remover
            </button>
          </div>

          <label class="relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden group"
            :class="imagePreview
              ? 'border-transparent'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-600 bg-neutral-50 dark:bg-neutral-950/30'"
          >
            <img v-if="imagePreview" :src="imagePreview" class="absolute inset-0 w-full h-full object-cover rounded-xl" />
            <div v-if="imagePreview" class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-xl flex items-center justify-center">
              <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Trocar imagem
              </span>
            </div>
            <div v-if="!imagePreview" class="flex flex-col items-center gap-3 text-neutral-400 dark:text-neutral-500 px-6 text-center">
              <div class="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Clique para selecionar</p>
                <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">JPG, PNG, WEBP — a imagem será cortada em formato quadrado</p>
              </div>
            </div>
            <input type="file" accept="image/*" class="sr-only" @change="onImageChange" />
          </label>

          <!-- Crop modal -->
          <Teleport to="body">
            <Transition name="crop-modal">
              <div v-if="cropSrc" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="cancelCrop" />

                <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                  <!-- Header -->
                  <div class="px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                      <h4 class="font-bold text-neutral-900 dark:text-neutral-100">Ajustar imagem</h4>
                      <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Arraste para reposicionar · Scroll para zoom</p>
                    </div>
                    <button type="button" @click="cancelCrop" class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <!-- Cropper -->
                  <div class="bg-neutral-950 relative" style="height: 380px">
                    <Cropper
                      ref="cropperRef"
                      :src="cropSrc"
                      :stencil-props="{ aspectRatio: 1 }"
                      :default-size="{ width: 300, height: 300 }"
                      class="w-full h-full"
                    />
                  </div>

                  <!-- Controls -->
                  <div class="px-6 py-4 flex items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="cropperRef.rotate(-90)"
                        class="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Girar 90°"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      <button
                        type="button"
                        @click="cropperRef.rotate(90)"
                        class="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Girar -90°"
                      >
                        <svg class="w-4 h-4 scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                    <div class="flex gap-3 ml-auto">
                      <button type="button" @click="cancelCrop" class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        Cancelar
                      </button>
                      <button type="button" @click="confirmCrop" class="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        Usar imagem
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>

        <!-- Variações -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Variações (tamanhos)</h2>
            <button type="button" @click="addVariation" class="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Adicionar
            </button>
          </div>
          <div v-if="form.variations.length === 0" class="text-xs text-neutral-400 italic">
            Sem variações — o preço será definido pela primeira variação adicionada.
          </div>
          <div v-for="(variation, i) in form.variations" :key="i" class="flex items-center gap-2">
            <input v-model="variation.name" type="text" placeholder="Ex: 300ml" required class="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15" />
            <input v-model="variation.price" type="number" step="0.01" min="0" placeholder="Preço" required class="w-24 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15" />
            <input v-model="variation.maxAdditionals" type="number" min="0" placeholder="Máx comp." title="Máximo de complementos neste tamanho" class="w-24 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15" />
            <button type="button" @click="removeVariation(i)" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Estoque e peso -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-4">
          <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Estoque e precificação</h2>

          <div class="flex items-center gap-3">
            <input v-model="form.manageStock" id="prod-manage-stock" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <label for="prod-manage-stock" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Controlar Estoque</label>
          </div>
          <div v-if="form.manageStock" class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Quantidade em Estoque</label>
            <input v-model="form.stock" type="number" min="0" required class="w-40 px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400" placeholder="0" />
          </div>

          <div class="flex items-center gap-3">
            <input v-model="form.weightBased" id="prod-weight-based" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <label for="prod-weight-based" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Produto vendido por peso</label>
          </div>
          <div v-if="form.weightBased" class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Preço por KG (R$)</label>
              <input v-model.number="form.pricePerKg" type="number" min="0" step="0.01" placeholder="0,00" class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Valor mínimo (R$)</label>
              <input v-model.number="form.minPrice" type="number" min="0" step="0.01" placeholder="0,00" class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400" />
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/app/produtos" class="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors">
            Cancelar
          </RouterLink>
          <button type="submit" :disabled="salvando" class="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm hover:shadow-md">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { CatalogService } from '@/services/http'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const isEditing = computed(() => !!route.params.id)
const salvando = ref(false)
const categories = shallowRef([])

const form = ref({
  name: '', description: '', categoryId: '', status: true,
  manageStock: false, stock: 0, variations: [],
  weightBased: false, pricePerKg: 0, minPrice: 0,
})

const imagePreview = ref(null)
const imageBase64 = ref(null)
const cropSrc = ref(null)
const cropperRef = ref(null)

onMounted(async () => {
  const catRes = await CatalogService.getCategories({ all: true })
  categories.value = catRes.data

  if (isEditing.value) {
    try {
      const { data } = await CatalogService.getProduct(route.params.id, { all: true })
      imagePreview.value = data.imageUrl || null
      form.value = {
        name: data.name,
        description: data.description || '',
        categoryId: data.categoryId,
        status: data.status,
        manageStock: data.manageStock || false,
        stock: data.stock || 0,
        variations: (data.variations || []).map((v) => ({ name: v.name, price: v.price, maxAdditionals: v.maxAdditionals ?? null })),
        weightBased: data.weightBased || false,
        pricePerKg: data.pricePerKg || 0,
        minPrice: data.minPrice || 0,
      }
    } catch {
      toast.error('Erro ao carregar produto')
      router.push('/app/produtos')
    }
  } else {
    form.value.categoryId = categories.value[0]?.id || ''
  }
})

const onImageChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { cropSrc.value = ev.target.result }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const confirmCrop = () => {
  const { canvas } = cropperRef.value.getResult()
  imageBase64.value = canvas.toDataURL('image/jpeg', 0.9)
  imagePreview.value = imageBase64.value
  cropSrc.value = null
}

const cancelCrop = () => { cropSrc.value = null }

const addVariation = () => { form.value.variations.push({ name: '', price: 0, maxAdditionals: null }) }
const removeVariation = (i) => { form.value.variations.splice(i, 1) }

const saveProduct = async () => {
  salvando.value = true
  try {
    const payload = { ...form.value, ...(imageBase64.value ? { imageBase64: imageBase64.value } : {}) }
    if (isEditing.value) {
      await CatalogService.updateProduct(route.params.id, payload)
      toast.success('Atualizado com sucesso!')
    } else {
      await CatalogService.createProduct(payload)
      toast.success('Criado com sucesso!')
    }
    router.push('/app/produtos')
  } catch {
    toast.error('Erro ao salvar produto')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.crop-modal-enter-active,
.crop-modal-leave-active {
  transition: opacity 0.2s ease;
}
.crop-modal-enter-active .relative,
.crop-modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.crop-modal-enter-from,
.crop-modal-leave-to {
  opacity: 0;
}
.crop-modal-enter-from .relative {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
