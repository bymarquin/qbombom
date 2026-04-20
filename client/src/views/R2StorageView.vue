<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Cloudflare R2
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Liste, envie e remova arquivos do bucket sem sair do painel.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="loadFiles"
          :disabled="isLoading"
          class="px-4 py-2.5 rounded-lg text-sm font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>{{ isLoading ? 'Atualizando...' : 'Atualizar' }}</span>
        </button>

        <label
          class="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer inline-flex items-center gap-2"
        >
          <Upload class="w-4 h-4" />
          Selecionar Arquivos
          <input type="file" multiple class="hidden" @change="onPickFiles" />
        </label>
      </div>
    </header>

    <section class="mb-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-2">
          <label class="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Prefixo/Pasta</label>
          <input
            v-model="prefix"
            type="text"
            placeholder="ex: products ou banners/home"
            class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 transition-all"
            @keyup.enter="loadFiles"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="loadFiles"
            class="w-full px-4 py-2.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Filtrar
          </button>
        </div>
      </div>

      <div v-if="uploadQueue.length" class="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <div
          v-for="item in uploadQueue"
          :key="item.id"
          class="text-xs bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800"
        >
          <div class="flex items-center justify-between gap-3 mb-1">
            <span class="font-medium text-neutral-700 dark:text-neutral-200 truncate">{{ item.name }}</span>
            <span class="text-neutral-500 dark:text-neutral-400">{{ item.progress }}%</span>
          </div>
          <div class="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div class="h-full bg-red-600 transition-all duration-150" :style="{ width: `${item.progress}%` }" />
          </div>
        </div>
      </div>
    </section>

    <div
      class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 flex-1 overflow-hidden flex flex-col"
    >
      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-xs uppercase text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/30"
            >
              <th class="py-4 px-6 font-medium">Arquivo</th>
              <th class="py-4 px-6 font-medium">Tamanho</th>
              <th class="py-4 px-6 font-medium">Atualizado em</th>
              <th class="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="files.length === 0 && !isLoading">
              <td colspan="4" class="py-8 text-center text-neutral-500 dark:text-neutral-500">
                Nenhum arquivo encontrado para esse prefixo.
              </td>
            </tr>
            <tr
              v-for="file in files"
              :key="file.key"
              class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-medium text-neutral-900 dark:text-neutral-100 break-all">{{ file.key }}</div>
                <a
                  v-if="file.url"
                  :href="file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-red-600 hover:text-red-700"
                >
                  Abrir URL
                </a>
              </td>
              <td class="py-4 px-6 text-neutral-600 dark:text-neutral-300">{{ formatBytes(file.size) }}</td>
              <td class="py-4 px-6 text-neutral-500 dark:text-neutral-400">{{ formatDate(file.lastModified) }}</td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="copyUrl(file.url)"
                    :disabled="!file.url"
                    title="Copiar URL"
                    class="p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    @click="renameFile(file.key)"
                    title="Renomear ou mover"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="removeFile(file.key)"
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

      <div v-if="hasMore && files.length > 0" class="p-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
        <button
          @click="loadMoreFiles"
          :disabled="isLoadingMore"
          class="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingMore ? 'Carregando...' : 'Carregar mais' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Copy, Pencil, Trash2, Upload } from 'lucide-vue-next'
import { R2Service } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const toast = useToastStore()
const dialog = useDialogStore()

const prefix = ref('')
const files = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const uploadQueue = ref([])
const continuationToken = ref(null)
const hasMore = ref(false)

onMounted(loadFiles)

function formatBytes(value = 0) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(value)
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('pt-BR')
}

async function loadFiles() {
  isLoading.value = true
  continuationToken.value = null
  try {
    const res = await R2Service.listFiles({ prefix: prefix.value, maxKeys: 100 })
    files.value = res.data.files || []
    continuationToken.value = res.data.nextContinuationToken || null
    hasMore.value = !!res.data.isTruncated
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao listar arquivos no R2.')
  } finally {
    isLoading.value = false
  }
}

async function loadMoreFiles() {
  if (!continuationToken.value) return

  isLoadingMore.value = true
  try {
    const res = await R2Service.listFiles({
      prefix: prefix.value,
      maxKeys: 100,
      continuationToken: continuationToken.value,
    })

    files.value = [...files.value, ...(res.data.files || [])]
    continuationToken.value = res.data.nextContinuationToken || null
    hasMore.value = !!res.data.isTruncated
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao paginar arquivos.')
  } finally {
    isLoadingMore.value = false
  }
}

async function onPickFiles(event) {
  const selected = Array.from(event.target.files || [])
  event.target.value = ''
  if (!selected.length) return

  for (const file of selected) {
    const queueItem = {
      id: `${Date.now()}_${Math.random()}`,
      name: file.name,
      progress: 0,
    }
    uploadQueue.value.push(queueItem)

    try {
      await R2Service.uploadFile(
        {
          file,
          prefix: prefix.value,
        },
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return
            queueItem.progress = Math.min(
              100,
              Math.round((progressEvent.loaded * 100) / progressEvent.total),
            )
          },
        },
      )
      queueItem.progress = 100
      toast.success(`Arquivo enviado: ${file.name}`)
    } catch (error) {
      toast.error(error.response?.data?.error || `Falha ao enviar: ${file.name}`)
    }
  }

  uploadQueue.value = []
  await loadFiles()
}

async function removeFile(key) {
  const confirmed = await dialog.confirm({
    title: 'Excluir arquivo?',
    message: `Deseja realmente excluir ${key}? Essa acao nao pode ser desfeita.`,
    confirmLabel: 'Excluir',
    cancelLabel: 'Cancelar',
  })

  if (!confirmed) return

  try {
    await R2Service.deleteFile(key)
    toast.success('Arquivo removido com sucesso.')
    await loadFiles()
  } catch (error) {
    toast.error(error.response?.data?.error || 'Falha ao remover arquivo.')
  }
}

async function copyUrl(url) {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    toast.success('URL copiada.')
  } catch {
    toast.error('Nao foi possivel copiar a URL.')
  }
}

function getParentPath(key) {
  const index = key.lastIndexOf('/')
  if (index === -1) return ''
  return key.slice(0, index)
}

async function renameFile(sourceKey) {
  const suggestion = sourceKey
  const destinationInput = window.prompt(
    'Informe o novo caminho (chave completa) ou apenas novo nome do arquivo:',
    suggestion,
  )

  if (!destinationInput) return

  const trimmed = destinationInput.trim()
  if (!trimmed) return

  const destinationKey = trimmed.includes('/') ? trimmed : [getParentPath(sourceKey), trimmed].filter(Boolean).join('/')

  try {
    await R2Service.moveFile(sourceKey, destinationKey)
    toast.success('Arquivo movido/renomeado com sucesso.')
    await loadFiles()
  } catch (error) {
    toast.error(error.response?.data?.error || 'Falha ao mover arquivo.')
  }
}
</script>
