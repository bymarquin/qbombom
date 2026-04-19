<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Produtos
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Gerencie os produtos do cardápio.
        </p>
      </div>
      <button
        @click="openModal()"
        class="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Novo Produto
      </button>
    </header>

    <div
      class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex-1 overflow-hidden flex flex-col"
    >
      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-xs uppercase text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/30"
            >
              <th class="py-4 px-6 font-medium">Nome</th>
              <th class="py-4 px-6 font-medium">A partir de</th>
              <th class="py-4 px-6 font-medium">Categoria</th>
              <th class="py-4 px-6 font-medium">Estoque</th>
              <th class="py-4 px-6 font-medium">Status</th>
              <th class="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="products.length === 0">
              <td colspan="6" class="py-8 text-center text-neutral-500 dark:text-neutral-500">
                Nenhum produto encontrado.
              </td>
            </tr>
            <tr
              v-for="prod in products"
              :key="prod.id"
              class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-medium text-neutral-900 dark:text-neutral-100">
                  {{ prod.name }}
                </div>
                <div
                  class="text-xs text-neutral-500 dark:text-neutral-500 truncate max-w-xs mt-0.5"
                  v-if="prod.description"
                >
                  {{ prod.description }}
                </div>
              </td>
              <td class="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-medium">
                {{ minPriceLabel(prod) }}
              </td>
              <td class="py-4 px-6 text-neutral-500 dark:text-neutral-500">
                {{ getCategoryName(prod.categoryId) }}
              </td>
              <td class="py-4 px-6">
                <span v-if="!prod.manageStock" class="text-neutral-400 dark:text-neutral-600 text-xs italic">-</span>
                <span v-else :class="prod.stock > 10 ? 'text-green-600 font-bold' : (prod.stock > 0 ? 'text-orange-500 font-bold' : 'text-red-600 font-bold')">
                  {{ prod.stock }} un
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  :class="
                    prod.status
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                  "
                  class="px-2.5 py-1 rounded-md text-xs font-medium border"
                >
                  {{ prod.status ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink
                    :to="{ name: 'complementos', query: { productId: prod.id, productName: prod.name } }"
                    title="Complementos"
                    class="p-1.5 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-800 rounded-md transition-colors inline-flex"
                  >
                    <ListPlus class="w-4 h-4" />
                  </RouterLink>
                  <button
                    @click="openModal(prod)"
                    title="Editar"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteProduct(prod.id)"
                    title="Excluir"
                    class="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-md transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-neutral-800/50 overflow-hidden max-h-[90vh] flex flex-col transform transition-all"
      >
        <div
          class="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center shrink-0 bg-neutral-50 dark:bg-neutral-950/50"
        >
          <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ editingItem ? 'Editar Produto' : 'Novo Produto' }}
          </h3>
          <button
            @click="closeModal"
            class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 transition-colors rounded-full p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div class="p-8 overflow-y-auto">
          <form @submit.prevent="saveProduct" class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Nome do Produto</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                placeholder="Ex: X-Bacon"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Descrição</label
              >
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 resize-none"
                placeholder="Ingredientes e detalhes..."
              ></textarea>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Imagem do Produto</label>
              <label
                class="relative flex flex-col items-center justify-center gap-2 w-full h-72 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-red-500 transition-colors overflow-hidden bg-neutral-50 dark:bg-neutral-950/30"
              >
                <img v-if="imagePreview" :src="imagePreview" class="absolute inset-0 w-full h-full object-cover" />
                <div v-if="!imagePreview" class="flex flex-col items-center gap-1 text-neutral-400">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-xs">Clique para selecionar</span>
                </div>
                <div v-else class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">Clique para trocar</div>
                <input type="file" accept="image/*" class="sr-only" @change="onImageChange" />
              </label>
            </div>

            <!-- MODAL DE CROP -->
            <div
              v-if="cropSrc"
              class="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
                <div class="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <h4 class="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Ajustar imagem</h4>
                  <button @click="cancelCrop" class="text-neutral-400 hover:text-neutral-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div class="p-4 bg-neutral-950 flex items-center justify-center" style="height: 320px">
                  <Cropper
                    ref="cropperRef"
                    :src="cropSrc"
                    :stencil-props="{ aspectRatio: 1 }"
                    class="w-full h-full"
                  />
                </div>
                <div class="px-6 py-4 flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button type="button" @click="cancelCrop" class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700">Cancelar</button>
                  <button type="button" @click="confirmCrop" class="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Usar imagem</button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Categoria</label
                >
                <select
                  v-model="form.categoryId"
                  required
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 cursor-pointer"
                >
                  <option disabled value="">Selecione...</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Variações -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Variações (tamanhos)</label>
                <button
                  type="button"
                  @click="addVariation"
                  class="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  Adicionar
                </button>
              </div>
              <div v-if="form.variations.length === 0" class="text-xs text-neutral-400 italic py-1">
                Sem variações — o preço será definido pela primeira variação adicionada.
              </div>
              <div
                v-for="(variation, i) in form.variations"
                :key="i"
                class="flex items-center gap-2"
              >
                <input
                  v-model="variation.name"
                  type="text"
                  placeholder="Ex: 300ml"
                  required
                  class="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
                />
                <input
                  v-model="variation.price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Preço"
                  required
                  class="w-24 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
                />
                <input
                  v-model="variation.maxAdditionals"
                  type="number"
                  min="0"
                  placeholder="Máx comp."
                  title="Máximo de complementos gratuitos neste tamanho"
                  class="w-24 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
                />
                <button
                  type="button"
                  @click="removeVariation(i)"
                  class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center gap-3">
                <input
                  v-model="form.manageStock"
                  id="prod-manage-stock"
                  type="checkbox"
                  class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer"
                />
                <label
                  for="prod-manage-stock"
                  class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >Controlar Estoque</label
                >
              </div>
              <div class="flex flex-col gap-2" v-if="form.manageStock">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Quantidade em Estoque</label
                >
                <input
                  v-model="form.stock"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Produto por peso -->
            <div class="flex items-center gap-3 mt-1">
              <input
                v-model="form.weightBased"
                id="prod-weight-based"
                type="checkbox"
                class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer"
              />
              <label for="prod-weight-based" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                Produto vendido por peso
              </label>
            </div>
            <div v-if="form.weightBased" class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Preço por KG (R$)</label>
                <input
                  v-model.number="form.pricePerKg"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Valor mínimo (R$)</label>
                <input
                  v-model.number="form.minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-1">
              <input
                v-model="form.status"
                id="prod-status"
                type="checkbox"
                class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer"
              />
              <label
                for="prod-status"
                class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >Produto Ativo</label
              >
            </div>

            <div
              class="mt-4 pt-6 flex justify-end gap-3 shrink-0 border-t border-neutral-100 dark:border-neutral-800/50"
            >
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import { Pencil, Trash2, ListPlus } from 'lucide-vue-next'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { CatalogService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const toast = useToastStore()
const dialog = useDialogStore()
const products = shallowRef([])
const categories = shallowRef([])
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '', description: '', categoryId: '', status: true, manageStock: false, stock: 0, variations: [], weightBased: false, pricePerKg: 0, minPrice: 0 })

const minPriceLabel = (prod) => {
  const prices = (prod.variations || []).map((v) => Number(v.price)).filter((p) => p > 0)
  if (prices.length === 0) return '—'
  return `R$ ${Math.min(...prices).toFixed(2).replace('.', ',')}`
}
const imagePreview = ref(null)
const imageBase64 = ref(null)
const cropSrc = ref(null)
const cropperRef = ref(null)


onMounted(() => loadData())

const loadData = async () => {
  try {
    const [catRes, prodRes] = await Promise.all([
      CatalogService.getCategories({ all: true }),
      CatalogService.getProducts({ all: true }),
    ])
    categories.value = catRes.data
    products.value = prodRes.data
  } catch (error) {
    console.error(error)
  }
}

const getCategoryName = (id) => {
  const cat = categories.value.find((c) => c.id === id)
  return cat ? cat.name : 'Desconhecida'
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
  imagePreview.value = null
  imageBase64.value = null
  cropSrc.value = null
}

const openModal = (prod = null) => {
  imageBase64.value = null
  if (prod) {
    editingItem.value = prod
    imagePreview.value = prod.imageUrl || null
    form.value = {
      name: prod.name,
      description: prod.description || '',
      categoryId: prod.categoryId,
      status: prod.status,
      manageStock: prod.manageStock || false,
      stock: prod.stock || 0,
      variations: (prod.variations || []).map((v) => ({ name: v.name, price: v.price, maxAdditionals: v.maxAdditionals ?? null })),
      weightBased: prod.weightBased || false,
      pricePerKg: prod.pricePerKg || 0,
      minPrice: prod.minPrice || 0,
    }
  } else {
    editingItem.value = null
    imagePreview.value = null
    form.value = {
      name: '',
      description: '',
      categoryId: categories.value[0]?.id || '',
      status: true,
      manageStock: false,
      stock: 0,
      variations: [],
      weightBased: false,
      pricePerKg: 0,
      minPrice: 0,
    }
  }
  showModal.value = true
}

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

const saveProduct = async () => {
  try {
    const payload = { ...form.value, ...(imageBase64.value ? { imageBase64: imageBase64.value } : {}) }
    if (editingItem.value) {
      await CatalogService.updateProduct(editingItem.value.id, payload)
      toast.success('Atualizado com sucesso!')
    } else {
      await CatalogService.createProduct(payload)
      toast.success('Criado com sucesso!')
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error(error)
  }
}

const addVariation = () => {
  form.value.variations.push({ name: '', price: 0, maxAdditionals: null })
}

const removeVariation = (index) => {
  form.value.variations.splice(index, 1)
}

const deleteProduct = async (id) => {
  const confirmed = await dialog.confirm({
    title: 'Excluir produto?',
    message: 'Tem certeza? Essa ação não poderá ser desfeita.',
    confirmLabel: 'Excluir',
    cancelLabel: 'Cancelar',
  })
  if (!confirmed) return

  try {
    await CatalogService.deleteProduct(id)
    toast.success('Removido.')
    await loadData()
  } catch (error) {
    console.error(error)
  }
}

</script>
