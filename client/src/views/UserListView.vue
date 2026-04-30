<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">Equipe</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">Gerencie os usuários e permissões do sistema.</p>
      </div>
      <button
        @click="openModal()"
        class="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Novo Usuário
      </button>
    </header>

    <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex-1 overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-xs uppercase text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/30">
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
              <td class="py-4 px-6 font-medium text-neutral-900 dark:text-neutral-100">{{ user.name }}</td>
              <td class="py-4 px-6 text-neutral-500 dark:text-neutral-500">{{ user.email }}</td>
              <td class="py-4 px-6">
                <span class="px-2.5 py-1 rounded-md text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900">
                  {{ ROLE_LABELS[user.role] || user.role }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  class="px-2.5 py-1 rounded-md text-xs font-medium border"
                  :class="user.status
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900'
                    : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'"
                >
                  {{ user.status ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="resendInvite(user)"
                    title="Reenviar convite"
                    class="p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    <MailIcon class="w-4 h-4" />
                  </button>
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
      <div class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-100 dark:border-neutral-800/50 overflow-hidden my-8">
        <div class="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/50">
          <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}
          </h3>
          <button @click="closeModal" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-full p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveUser" class="p-8 flex flex-col gap-5">
          <!-- Aviso de convite (apenas ao criar) -->
          <div v-if="!editingUser" class="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <MailIcon class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Um e-mail de convite será enviado para que o usuário crie a própria senha.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome Completo</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ex: João da Silva"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 transition-all"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="Ex: joao@empresa.com"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">PIN de Acesso PDV</label>
              <input
                v-model="form.pin"
                type="text"
                maxlength="6"
                placeholder="Opcional (4-6 dígitos)"
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 transition-all"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Função</label>
              <select
                v-model="form.role"
                required
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 transition-all cursor-pointer"
              >
                <option value="CASHIER">Caixa</option>
                <option value="DELIVERY">Entregador</option>
                <option value="MANAGER">Gerente</option>
                <option value="SUPER_ADMIN">Admin. Geral</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <input
              v-model="form.status"
              id="user-status"
              type="checkbox"
              class="w-4 h-4 rounded border-neutral-300 accent-red-600 cursor-pointer"
            />
            <label for="user-status" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
              Usuário Ativo no Sistema
            </label>
          </div>

          <div class="mt-4 pt-2 flex justify-end gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all"
            >
              {{ editingUser ? 'Salvar' : 'Criar e Enviar Convite' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Pencil, Trash2, Mail as MailIcon, Plus, X } from 'lucide-vue-next'
import { UserService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const toast = useToastStore()
const dialog = useDialogStore()

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Gerente',
  CASHIER: 'Caixa',
  DELIVERY: 'Entregador',
}

const users = ref([])
const showModal = ref(false)
const editingUser = ref(null)

const EMPTY_FORM = { name: '', email: '', pin: '', role: 'CASHIER', status: true }
const form = ref({ ...EMPTY_FORM })

onMounted(loadData)

async function loadData() {
  try {
    const res = await UserService.getUsers()
    users.value = res.data
  } catch {
    toast.error('Erro ao carregar usuários')
  }
}

function openModal(user = null) {
  editingUser.value = user
  form.value = user
    ? { name: user.name, email: user.email, pin: user.pin || '', role: user.role, status: user.status }
    : { ...EMPTY_FORM }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
}

async function saveUser() {
  try {
    const payload = { ...form.value, pin: form.value.pin || null }

    if (editingUser.value) {
      await UserService.updateUser(editingUser.value.id, payload)
      toast.success('Usuário atualizado!')
    } else {
      await UserService.createUser(payload)
      toast.success('Usuário criado! Convite enviado por e-mail.')
    }

    closeModal()
    await loadData()
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao salvar usuário')
  }
}

async function resendInvite(user) {
  try {
    await UserService.resendInvite(user.id)
    toast.success(`Convite reenviado para ${user.email}`)
  } catch {
    toast.error('Erro ao reenviar convite')
  }
}

async function deleteUser(id) {
  const confirmed = await dialog.confirm({
    title: 'Excluir usuário?',
    message: 'Tem certeza que deseja remover este usuário?',
    confirmLabel: 'Excluir',
    cancelLabel: 'Cancelar',
  })
  if (!confirmed) return

  try {
    await UserService.deleteUser(id)
    toast.success('Usuário removido.')
    await loadData()
  } catch {
    toast.error('Erro ao remover usuário')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(209, 213, 219, 0.8); }
.dark .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(82, 82, 91, 0.8); }
</style>
