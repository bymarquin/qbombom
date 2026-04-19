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
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Novo Produto
      </RouterLink>
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
import { shallowRef, onMounted } from 'vue'
import { Pencil, Trash2, ListPlus } from 'lucide-vue-next'
import { CatalogService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const toast = useToastStore()
const dialog = useDialogStore()
const products = shallowRef([])
const categories = shallowRef([])

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
  } catch (error) {
    console.error(error)
  }
}

const getCategoryName = (id) => {
  const cat = categories.value.find((c) => c.id === id)
  return cat ? cat.name : 'Desconhecida'
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
