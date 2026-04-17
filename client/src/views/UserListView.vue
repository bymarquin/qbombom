<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Equipe
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Gerencie os usuários e permissões do sistema.
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
        Novo Usuário
      </button>
    </header>

    <div
      class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex-1 overflow-hidden flex flex-col"
    >
      <div class="flex-1 overflow-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-xs uppercase text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/30"
            >
              <th class="py-4 px-6 font-medium">Nome</th>
              <th class="py-4 px-6 font-medium">Email</th>
              <th class="py-4 px-6 font-medium">Função</th>
              <th class="py-4 px-6 font-medium">Status</th>
              <th class="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="users.length === 0">
              <td colspan="5" class="py-8 text-center text-neutral-500 dark:text-neutral-500">
                Nenhum usuário encontrado.
              </td>
            </tr>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <td class="py-4 px-6 font-medium text-neutral-900 dark:text-neutral-100">
                {{ user.name }}
              </td>
              <td class="py-4 px-6 text-neutral-500 dark:text-neutral-500">
                {{ user.email }}
              </td>
              <td class="py-4 px-6">
                <span class="px-2.5 py-1 rounded-md text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900">
                  {{ roleLabels[user.role] || user.role }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  :class="
                    user.status
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900'
                      : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                  "
                  class="px-2.5 py-1 rounded-md text-xs font-medium border"
                >
                  {{ user.status ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openModal(user)"
                    title="Editar"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteUser(user.id)"
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
      class="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-100 dark:border-neutral-800/50 overflow-hidden transform transition-all my-8"
      >
        <div
          class="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/50"
        >
          <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ editingItem ? 'Editar Usuário' : 'Novo Usuário' }}
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
        <form @submit.prevent="saveUser" class="p-8 flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Nome Completo</label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Email (Acesso)</label
            >
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="Ex: joao@empresa.com"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Senha {{ editingItem ? '(Deixe em branco para manter)' : '' }}
            </label>
            <input
              v-model="form.password"
              type="password"
              :required="!editingItem"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="••••••••"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >PIN de Acesso PDV</label
              >
              <input
                v-model="form.pin"
                type="text"
                maxlength="6"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                placeholder="Opcional (4-6 dígitos)"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Função</label
              >
              <select
                v-model="form.role"
                required
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
              >
                <option value="CASHIER">Caixa</option>
                <option value="DELIVERY">Entregador</option>
                <option value="MANAGER">Gerente</option>
                <option value="SUPER_ADMIN">Admin. Geral</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-1">
            <input
              v-model="form.status"
              id="user-status"
              type="checkbox"
              class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer"
            />
            <label
              for="user-status"
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              Usuário Ativo no Sistema
            </label>
          </div>

          <div class="mt-4 pt-2 flex justify-end gap-3">
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { UserService } from '@/services/http'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const users = ref([])
const showModal = ref(false)
const editingItem = ref(null)

const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Gerente',
  CASHIER: 'Caixa',
  DELIVERY: 'Entregador'
}

const form = ref({ 
  name: '', 
  email: '', 
  password: '', 
  pin: '', 
  role: 'CASHIER', 
  status: true 
})

onMounted(() => loadData())

const loadData = async () => {
  try {
    const res = await UserService.getUsers()
    users.value = res.data
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar usuários')
  }
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const openModal = (user = null) => {
  if (user) {
    editingItem.value = user
    form.value = { 
      name: user.name, 
      email: user.email,
      password: '', // Não carregamos a senha atual
      pin: user.pin || '',
      role: user.role,
      status: user.status 
    }
  } else {
    editingItem.value = null
    form.value = { 
      name: '', 
      email: '', 
      password: '', 
      pin: '', 
      role: 'CASHIER', 
      status: true 
    }
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    // Preparar payload: se estiver editando e a senha estiver vazia, remove ela do objeto
    const payload = { ...form.value }
    if (editingItem.value && !payload.password) {
      delete payload.password
    }

    // PIN vazio deve ser enviado como nulo se necessário (ou deixar que o backend ignore se estiver usando string vazia, mas null é melhor para uniq constraints se suportado)
    if (!payload.pin) {
      payload.pin = null
    }

    if (editingItem.value) {
      await UserService.updateUser(editingItem.value.id, payload)
      toast.success('Usuário atualizado!')
    } else {
      await UserService.createUser(payload)
      toast.success('Usuário criado!')
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error(error)
    const errorMsg = error.response?.data?.error || 'Erro ao salvar usuário'
    toast.error(errorMsg)
  }
}

const deleteUser = async (id) => {
  if (!confirm('Atenção: Tem certeza que deseja remover este usuário?')) return
  try {
    await UserService.deleteUser(id)
    toast.success('Usuário removido.')
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao remover usuário')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(209, 213, 219, 0);
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(209, 213, 219, 0.8);
}
.dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(82, 82, 91, 0.8);
}
</style>
