<template>
  <div class="h-full flex flex-col font-sans">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">Complementos</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">{{ productName }}</p>
      </div>
      <RouterLink
        to="/app/produtos"
        class="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      >
        Voltar
      </RouterLink>
    </div>

    <!-- Conteúdo (estrutura do modal) -->
    <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex-1 overflow-hidden flex">

      <!-- Coluna esquerda: grupos globais -->
      <div class="w-1/2 border-r border-neutral-100 dark:border-neutral-800/50 flex flex-col overflow-hidden">
        <div class="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between shrink-0">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Todos os Grupos</span>
          <button @click="openNewGroupForm" class="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Novo grupo
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div v-if="loadingGroups" class="flex justify-center py-8">
            <div class="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else-if="allGroups.length === 0" class="text-center py-8 text-neutral-400 text-sm">
            Nenhum grupo criado ainda.
          </div>

          <div
            v-for="group in sortedGroups"
            :key="group.id"
            class="rounded-xl overflow-hidden border"
            :class="isAssigned(group.id)
              ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950'"
          >
            <div class="px-4 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{{ group.name }}</p>
                <p class="text-xs text-neutral-400">{{ group.items?.length || 0 }} opções</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button @click="editGroup(group)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors">
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button @click="deleteGroup(group.id)" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Itens do grupo -->
            <div class="px-4 pb-3 space-y-0.5">
              <div v-for="item in group.items" :key="item.id" class="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400 py-0.5">
                <span>{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span>R$ {{ parseFloat(item.price).toFixed(2) }}</span>
                  <button @click="deleteItem(item.id)" class="text-red-400 hover:text-red-600 transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add item inline -->
            <form @submit.prevent="saveItem(group.id)" class="flex gap-2 px-4 pb-3">
              <input v-model="newItemForm[group.id].name" type="text" placeholder="+ item" required class="flex-1 px-2.5 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-red-500" />
              <input v-model="newItemForm[group.id].price" type="number" step="0.01" min="0" placeholder="R$" required class="w-16 px-2 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-red-500" />
              <button type="submit" class="px-2.5 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white rounded text-xs font-medium hover:bg-neutral-900 transition-colors">Add</button>
            </form>
          </div>
        </div>

        <!-- Form novo/editar grupo -->
        <div v-if="isCreatingGroup" class="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 shrink-0">
          <form @submit.prevent="saveGroup" class="flex flex-col gap-3">
            <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ groupForm.id ? 'Editar Grupo' : 'Novo Grupo' }}</p>
            <input v-model="groupForm.name" type="text" required placeholder="Nome do grupo" class="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-red-500" />
            <div class="grid grid-cols-3 gap-2">
              <div class="flex flex-col gap-1">
                <label class="text-xs text-neutral-500 dark:text-neutral-400">Mín. escolhas</label>
                <input v-model.number="groupForm.minChoices" type="number" min="0" class="w-full px-2 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-500" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-neutral-500 dark:text-neutral-400">Máx. escolhas</label>
                <input v-model.number="groupForm.maxChoices" type="number" min="0" class="w-full px-2 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-500" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-neutral-500 dark:text-neutral-400">Grátis</label>
                <input v-model.number="groupForm.freeChoices" type="number" min="0" class="w-full px-2 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div
                class="relative w-9 h-5 rounded-full transition-colors"
                :class="groupForm.stepperMode ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-600'"
                @click="groupForm.stepperMode = !groupForm.stepperMode"
              >
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" :class="groupForm.stepperMode ? 'translate-x-4' : ''"></div>
              </div>
              <span class="text-xs text-neutral-600 dark:text-neutral-400">Modo stepper (quantidade por item)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div
                class="relative w-9 h-5 rounded-full transition-colors"
                :class="groupForm.isSaborGroup ? 'bg-red-600' : 'bg-neutral-300 dark:bg-neutral-600'"
                @click="groupForm.isSaborGroup = !groupForm.isSaborGroup"
              >
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" :class="groupForm.isSaborGroup ? 'translate-x-4' : ''"></div>
              </div>
              <span class="text-xs text-neutral-600 dark:text-neutral-400">Grupo de sabores do sorvete (limite = nº de bolas)</span>
            </label>
            <div class="flex justify-end gap-2">
              <button type="button" @click="cancelGroupForm" class="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-neutral-200 transition-colors">Cancelar</button>
              <button type="submit" class="px-3 py-1.5 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">Salvar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Coluna direita: grupos vinculados ao produto -->
      <div class="w-1/2 flex flex-col overflow-hidden">
        <div class="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vinculados a este produto</span>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div v-if="allGroups.length === 0" class="text-center py-8 text-neutral-400 text-sm">
            Crie grupos ao lado primeiro.
          </div>

          <div
            v-for="group in allGroups"
            :key="group.id"
            @click="toggleAssign(group)"
            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
            :class="isAssigned(group.id)
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-red-300 dark:hover:border-red-700'"
          >
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="isAssigned(group.id) ? 'border-red-600 bg-red-600' : 'border-neutral-300 dark:border-neutral-600'"
            >
              <svg v-if="isAssigned(group.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ group.name }}</p>
              <p class="text-xs text-neutral-400">{{ group.items?.length || 0 }} opções</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { AdditionalService, CatalogService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const route = useRoute()
const toast = useToastStore()
const dialog = useDialogStore()

const productId = route.query.productId
const productName = route.query.productName || 'Produto'

const allGroups = shallowRef([])
const assignedGroupIds = ref(new Set())
const loadingGroups = ref(false)
const isCreatingGroup = ref(false)
const groupForm = ref({ id: null, name: '' })
const newItemForm = ref({})

onMounted(() => loadGroups())

const loadGroups = async () => {
  loadingGroups.value = true
  try {
    const [allRes, prodRes] = await Promise.all([
      AdditionalService.getGroups(),
      CatalogService.getProduct(productId, { all: true }),
    ])
    allGroups.value = allRes.data
    const assigned = prodRes.data.additionalGroups || []
    assignedGroupIds.value = new Set(assigned.map((g) => g.id))
    allGroups.value.forEach((group) => {
      if (!newItemForm.value[group.id]) {
        newItemForm.value[group.id] = { name: '', price: 0 }
      }
    })
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar complementos')
  } finally {
    loadingGroups.value = false
  }
}

const isAssigned = (groupId) => assignedGroupIds.value.has(groupId)

const sortedGroups = computed(() => {
  const assigned = allGroups.value.filter((g) => isAssigned(g.id))
  const rest = allGroups.value.filter((g) => !isAssigned(g.id))
  return [...assigned, ...rest]
})

const toggleAssign = async (group) => {
  try {
    if (isAssigned(group.id)) {
      await AdditionalService.unassignGroup(group.id, productId)
      assignedGroupIds.value.delete(group.id)
    } else {
      await AdditionalService.assignGroup(group.id, productId)
      assignedGroupIds.value.add(group.id)
    }
    assignedGroupIds.value = new Set(assignedGroupIds.value)
  } catch {
    toast.error('Erro ao atualizar vínculo')
  }
}

const openNewGroupForm = () => {
  groupForm.value = { id: null, name: '', minChoices: 0, maxChoices: 5, freeChoices: 0, stepperMode: false, isSaborGroup: false }
  isCreatingGroup.value = true
}

const cancelGroupForm = () => {
  isCreatingGroup.value = false
}

const editGroup = (group) => {
  groupForm.value = {
    id: group.id,
    name: group.name,
    minChoices: group.minChoices ?? 0,
    maxChoices: group.maxChoices ?? 5,
    freeChoices: group.freeChoices ?? 0,
    stepperMode: group.stepperMode ?? false,
    isSaborGroup: group.isSaborGroup ?? false,
  }
  isCreatingGroup.value = true
}

const saveGroup = async () => {
  try {
    if (groupForm.value.id) {
      await AdditionalService.updateGroup(groupForm.value.id, groupForm.value)
      toast.success('Grupo atualizado!')
    } else {
      await AdditionalService.createGroup(groupForm.value)
      toast.success('Grupo criado!')
    }
    isCreatingGroup.value = false
    await loadGroups()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar grupo')
  }
}

const deleteGroup = async (id) => {
  const confirmed = await dialog.confirm({
    title: 'Excluir grupo?',
    message: 'Excluir este grupo e todos os seus itens?',
    confirmLabel: 'Excluir grupo',
    cancelLabel: 'Cancelar',
  })
  if (!confirmed) return
  try {
    await AdditionalService.deleteGroup(id)
    toast.success('Grupo excluído!')
    await loadGroups()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao excluir grupo')
  }
}

const saveItem = async (groupId) => {
  try {
    const itemData = newItemForm.value[groupId]
    if (!itemData?.name) return
    await AdditionalService.createItem({ ...itemData, additionalGroupId: groupId, status: true })
    newItemForm.value[groupId] = { name: '', price: 0 }
    await loadGroups()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao adicionar item')
  }
}

const deleteItem = async (itemId) => {
  try {
    await AdditionalService.deleteItem(itemId)
    await loadGroups()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao excluir item')
  }
}
</script>
