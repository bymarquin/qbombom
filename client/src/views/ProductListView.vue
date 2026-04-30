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
      <RouterLink
        to="/app/produtos/novo"
        class="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none flex items-center justify-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Novo Produto
      </RouterLink>
    </header>

    <div
      class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex-1 overflow-hidden flex flex-col"
    >
      <div class="p-4 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/40">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            v-model.trim="searchTerm"
            type="search"
            placeholder="Buscar por nome ou descricao..."
            class="w-full px-3 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
          />

          <select
            v-model="selectedCategoryId"
            class="w-full h-[42px] px-3.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 transition-all cursor-pointer dark:[color-scheme:dark]"
          >
            <option value="all">Todas categorias</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>

          <select
            v-model="selectedStatus"
            class="w-full h-[42px] px-3.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 transition-all cursor-pointer dark:[color-scheme:dark]"
          >
            <option value="all">Todos status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <button
            @click="resetFilters"
            :disabled="!hasActiveFilters"
            class="px-3 py-2.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpar filtros
          </button>
        </div>
      </div>

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
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="py-8 text-center text-neutral-500 dark:text-neutral-500">
                {{ products.length === 0 ? 'Nenhum produto encontrado.' : 'Nenhum produto corresponde aos filtros.' }}
              </td>
            </tr>
            <tr
              v-for="prod in filteredProducts"
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
                <div v-else class="flex items-center gap-2">
                  <button
                    @click="adjustStock(prod, -1)"
                    :disabled="isSavingStock(prod.id) || getStockDraft(prod) <= 0"
                    class="w-7 h-7 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    :value="getStockDraft(prod)"
                    type="number"
                    min="0"
                    inputmode="numeric"
                    class="w-16 px-2 py-1.5 text-sm text-center rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-500"
                    @focus="primeStockDraft(prod)"
                    @input="onStockInput(prod, $event.target.value)"
                    @blur="commitStock(prod)"
                    @keyup.enter="commitStock(prod)"
                  />
                  <button
                    @click="adjustStock(prod, 1)"
                    :disabled="isSavingStock(prod.id)"
                    class="w-7 h-7 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
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
                  <RouterLink
                    :to="{ name: 'produto-editar', params: { id: prod.id } }"
                    title="Editar"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors inline-flex"
                  >
                    <Pencil class="w-4 h-4" />
                  </RouterLink>
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

  </div>
</template>

<script setup>
import { shallowRef, ref, computed, onMounted } from 'vue'
import { Pencil, Trash2, ListPlus, Plus } from 'lucide-vue-next'
import { CatalogService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const toast = useToastStore()
const dialog = useDialogStore()
const products = shallowRef([])
const categories = shallowRef([])
const searchTerm = ref('')
const selectedCategoryId = ref('all')
const selectedStatus = ref('all')
const stockDrafts = ref({})
const stockSaving = ref({})

const minPriceLabel = (prod) => {
  const prices = (prod.variations || []).map((v) => Number(v.price)).filter((p) => p > 0)
  if (prices.length === 0) return '—'
  return `R$ ${Math.min(...prices).toFixed(2).replace('.', ',')}`
}

onMounted(() => loadData())

const loadData = async () => {
  try {
    const [catRes, prodRes] = await Promise.all([
      CatalogService.getCategories({ all: true }),
      CatalogService.getProducts({ all: true }),
    ])
    categories.value = catRes.data
    products.value = prodRes.data
    stockDrafts.value = Object.fromEntries(
      (prodRes.data || [])
        .filter((prod) => prod.manageStock)
        .map((prod) => [prod.id, normalizeStock(prod.stock)]),
    )
  } catch (error) {
    console.error(error)
  }
}

const normalizeStock = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.floor(numeric))
}

const isSavingStock = (productId) => !!stockSaving.value[productId]

const primeStockDraft = (prod) => {
  if (stockDrafts.value[prod.id] !== undefined) return
  stockDrafts.value = {
    ...stockDrafts.value,
    [prod.id]: normalizeStock(prod.stock),
  }
}

const getStockDraft = (prod) => {
  const draft = stockDrafts.value[prod.id]
  if (draft === undefined) return normalizeStock(prod.stock)
  return normalizeStock(draft)
}

const onStockInput = (prod, value) => {
  stockDrafts.value = {
    ...stockDrafts.value,
    [prod.id]: normalizeStock(value),
  }
}

const setProductStockLocally = (productId, stock) => {
  const idx = products.value.findIndex((item) => item.id === productId)
  if (idx === -1) return

  const next = [...products.value]
  next[idx] = { ...next[idx], stock }
  products.value = next
}

const saveStock = async (prod, value) => {
  if (!prod.manageStock) return

  const nextStock = normalizeStock(value)
  const currentStock = normalizeStock(prod.stock)

  if (nextStock === currentStock) {
    stockDrafts.value = { ...stockDrafts.value, [prod.id]: nextStock }
    return
  }

  if (isSavingStock(prod.id)) return
  stockSaving.value = { ...stockSaving.value, [prod.id]: true }

  try {
    await CatalogService.updateProduct(prod.id, { stock: nextStock, manageStock: true })
    setProductStockLocally(prod.id, nextStock)
    stockDrafts.value = { ...stockDrafts.value, [prod.id]: nextStock }
  } catch {
    toast.error('Nao foi possivel atualizar o estoque.')
    stockDrafts.value = { ...stockDrafts.value, [prod.id]: currentStock }
  } finally {
    const rest = { ...stockSaving.value }
    delete rest[prod.id]
    stockSaving.value = rest
  }
}

const adjustStock = async (prod, delta) => {
  primeStockDraft(prod)
  const next = normalizeStock(getStockDraft(prod) + delta)
  stockDrafts.value = { ...stockDrafts.value, [prod.id]: next }
  await saveStock(prod, next)
}

const commitStock = async (prod) => {
  primeStockDraft(prod)
  await saveStock(prod, getStockDraft(prod))
}

const getCategoryName = (id) => {
  const cat = categories.value.find((c) => c.id === id)
  return cat ? cat.name : 'Desconhecida'
}

const filteredProducts = computed(() => {
  const term = searchTerm.value.toLowerCase()

  return products.value.filter((prod) => {
    const categoryName = getCategoryName(prod.categoryId).toLowerCase()
    const matchesTerm =
      !term ||
      prod.name?.toLowerCase().includes(term) ||
      prod.description?.toLowerCase().includes(term) ||
      categoryName.includes(term)

    const matchesCategory =
      selectedCategoryId.value === 'all' ||
      prod.categoryId === selectedCategoryId.value

    const matchesStatus =
      selectedStatus.value === 'all' ||
      (selectedStatus.value === 'active' ? !!prod.status : !prod.status)

    return matchesTerm && matchesCategory && matchesStatus
  })
})

const hasActiveFilters = computed(() =>
  searchTerm.value.length > 0 || selectedCategoryId.value !== 'all' || selectedStatus.value !== 'all'
)

const resetFilters = () => {
  searchTerm.value = ''
  selectedCategoryId.value = 'all'
  selectedStatus.value = 'all'
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
