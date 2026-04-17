<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Clientes
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Gerencie a base de clientes (CRM).
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
        Novo Cliente
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
              <th class="py-4 px-6 font-medium">Contato</th>
              <th class="py-4 px-6 font-medium">Endereço</th>
              <th class="py-4 px-6 font-medium">Histórico</th>
              <th class="py-4 px-6 font-medium">Status</th>
              <th class="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="customers.length === 0">
              <td colspan="6" class="py-8 text-center text-neutral-500 dark:text-neutral-500">
                Nenhum cliente cadastrado.
              </td>
            </tr>
            <tr
              v-for="cust in customers"
              :key="cust.id"
              class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <td class="py-4 px-6 font-medium text-neutral-900 dark:text-neutral-100">
                {{ cust.name }}
              </td>
              <td class="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                <div v-if="cust.phone">{{ cust.phone }}</div>
                <div v-if="cust.email" class="text-xs text-neutral-400 mt-0.5">
                  {{ cust.email }}
                </div>
                <div v-if="!cust.phone && !cust.email" class="text-neutral-400 italic">
                  Não informado
                </div>
              </td>
              <td class="py-4 px-6 text-neutral-500 dark:text-neutral-500 truncate max-w-[200px]">
                {{ cust.address || '---' }}
              </td>
              <td class="py-4 px-6">
                <div class="text-neutral-900 dark:text-neutral-100">
                  {{ cust.totalOrders }} pedidos
                </div>
                <div class="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
                  R$ {{ parseFloat(cust.totalSpent).toFixed(2) }} gastos
                </div>
              </td>
              <td class="py-4 px-6">
                <span
                  :class="
                    cust.status
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                  "
                  class="px-2.5 py-1 rounded-md text-xs font-medium border"
                >
                  {{ cust.status ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openModal(cust)"
                    title="Editar"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteCustomer(cust.id)"
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
        class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-neutral-800/50 overflow-hidden transform transition-all flex flex-col max-h-[90vh]"
      >
        <div
          class="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/50 shrink-0"
        >
          <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ editingItem ? 'Editar Cliente' : 'Novo Cliente' }}
          </h3>
          <button
            @click="closeModal"
            class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 transition-colors rounded-full p-1 hover:bg-neutral-200 dark:bg-neutral-700"
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
        <div class="overflow-y-auto p-8">
          <form @submit.prevent="saveCustomer" class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Nome do Cliente</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                placeholder="Ex: João Silva"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Telefone / WhatsApp</label
                >
                <input
                  v-model="form.phone"
                  type="text"
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >E-mail</label
                >
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                  placeholder="joao@email.com"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Endereço Completo</label
              >
              <textarea
                v-model="form.address"
                rows="2"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 resize-none"
                placeholder="Rua, Número, Bairro..."
              ></textarea>
            </div>

            <div class="flex items-center gap-3 mt-1">
              <input
                v-model="form.status"
                id="cust-status"
                type="checkbox"
                class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer"
              />
              <label
                for="cust-status"
                class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >Cliente Ativo</label
              >
            </div>

            <div
              class="mt-4 pt-6 flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800/50"
            >
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:bg-neutral-700 rounded-lg transition-colors"
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
import { ref, onMounted } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { CustomerService } from '@/services/http'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const customers = ref([])
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '', phone: '', email: '', address: '', status: true })

onMounted(() => loadData())

const loadData = async () => {
  try {
    const res = await CustomerService.getCustomers()
    customers.value = res.data
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar clientes')
  }
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const openModal = (cust = null) => {
  if (cust) {
    editingItem.value = cust
    form.value = {
      name: cust.name,
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      status: cust.status,
    }
  } else {
    editingItem.value = null
    form.value = { name: '', phone: '', email: '', address: '', status: true }
  }
  showModal.value = true
}

const saveCustomer = async () => {
  try {
    if (editingItem.value) {
      await CustomerService.updateCustomer(editingItem.value.id, form.value)
      toast.success('Cliente atualizado!')
    } else {
      await CustomerService.createCustomer(form.value)
      toast.success('Cliente criado!')
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar cliente')
  }
}

const deleteCustomer = async (id) => {
  if (!confirm('Deseja realmente excluir este cliente?')) return
  try {
    await CustomerService.deleteCustomer(id)
    toast.success('Cliente excluído.')
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao excluir cliente')
  }
}
</script>
