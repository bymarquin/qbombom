<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          Armazenamento
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          Liste, envie e remova arquivos sem sair do painel.
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
      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Prefixo/Pasta</label>
          <input
            v-model="prefix"
            type="text"
            placeholder="ex: products ou banners/home"
            class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 transition-all"
            @keyup.enter="loadFiles"
          />
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between gap-3">
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ selectedKeys.length }} selecionado(s)
        </p>
        <button
          @click="removeSelectedFiles"
          :disabled="!hasSelectedFiles || isBulkDeleting"
          class="px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isBulkDeleting ? 'Excluindo...' : 'Excluir selecionados' }}
        </button>
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

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
      <div
        class="xl:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden flex flex-col min-h-0"
      >
        <div class="flex-1 overflow-auto">
          <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-xs uppercase text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/30"
            >
              <th class="py-4 px-4 font-medium w-10">
                <input
                  type="checkbox"
                  :checked="allVisibleSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 rounded border-neutral-300 accent-red-600"
                  title="Selecionar todos"
                />
              </th>
              <th class="py-4 px-6 font-medium">Arquivo</th>
              <th class="py-4 px-6 font-medium">Tamanho</th>
              <th class="py-4 px-6 font-medium">Atualizado em</th>
              <th class="py-4 px-6 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="files.length === 0 && !isLoading">
              <td colspan="5" class="py-8 text-center text-neutral-500 dark:text-neutral-500">
                Nenhum arquivo encontrado para esse prefixo.
              </td>
            </tr>
            <tr
              v-for="file in files"
              :key="file.key"
              @click="selectedFileKey = file.key"
              class="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 transition-colors cursor-pointer"
              :class="
                selectedFileKey === file.key
                  ? 'bg-red-50/70 dark:bg-red-500/10'
                  : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
              "
            >
              <td class="py-4 px-4" @click.stop>
                <input
                  type="checkbox"
                  :checked="isSelected(file.key)"
                  @change="toggleSelectFile(file.key)"
                  class="w-4 h-4 rounded border-neutral-300 accent-red-600"
                  :aria-label="`Selecionar ${file.key}`"
                />
              </td>
              <td class="py-4 px-6">
                <div class="font-medium text-neutral-900 dark:text-neutral-100 break-all">{{ file.key }}</div>
                <a
                  v-if="file.url"
                  :href="file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-red-600 hover:text-red-700"
                  @click.stop
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
                    @click.stop
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    @click="renameFile(file.key)"
                    title="Renomear ou mover"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-md transition-colors"
                    @click.stop
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="removeFile(file.key)"
                    title="Excluir"
                    class="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-md transition-colors"
                    @click.stop
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

      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 p-4 flex flex-col min-h-0">
        <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Preview</h3>

        <div v-if="!selectedFile" class="flex-1 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm flex items-center justify-center p-6 text-center">
          Selecione um arquivo para visualizar.
        </div>

        <template v-else>
          <div class="text-xs text-neutral-500 dark:text-neutral-400 mb-2 break-all">{{ selectedFile.key }}</div>

          <div
            v-if="isImageFile(selectedFile)"
            class="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 overflow-hidden min-h-[220px] flex items-center justify-center"
          >
            <img
              :src="selectedFile.url"
              :alt="selectedFile.key"
              class="max-h-[48vh] w-full h-full object-contain"
              loading="lazy"
            />
          </div>

          <div
            v-else
            class="flex-1 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm flex items-center justify-center p-6 text-center min-h-[220px]"
          >
            Esse arquivo nao e uma imagem. Use "Abrir URL" para visualizar em uma nova aba.
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              @click="copyUrl(selectedFile.url)"
              :disabled="!selectedFile.url"
              class="px-3 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copiar URL
            </button>
            <a
              v-if="selectedFile.url"
              :href="selectedFile.url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 text-center"
            >
              Abrir
            </a>
          </div>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="crop-modal">
        <div v-if="cropQueue.length > 0" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="cancelCropQueue" />
          <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div class="px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h4 class="font-bold text-neutral-900 dark:text-neutral-100">
                  Recortar antes do upload
                  <span class="ml-2 text-xs font-normal text-neutral-400">({{ cropQueueIdx + 1 }} de {{ cropQueue.length }})</span>
                </h4>
                <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Escolha o formato ou mantenha livre
                </p>
              </div>
              <button
                type="button"
                @click="cancelCropQueue"
                class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 pb-3 flex gap-2 flex-wrap">
              <button
                v-for="option in cropAspectOptions"
                :key="option.value"
                type="button"
                @click="cropAspect = option.value"
                class="px-2.5 py-1.5 text-xs rounded-lg border transition-colors"
                :class="
                  cropAspect === option.value
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                "
              >
                {{ option.label }}
              </button>
            </div>

            <div class="bg-neutral-950 relative" style="height: 380px">
              <Cropper
                ref="cropperRef"
                :src="currentCropItem?.preview"
                :stencil-component="RectangleStencil"
                :stencil-props="cropStencilProps"
                :default-size="{ width: 280, height: 280 }"
                class="w-full h-full"
              />
            </div>

            <div class="px-6 py-4 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                @click="uploadCurrentOriginal"
                :disabled="isCropUploading"
                class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {{ isCropUploading ? 'Enviando...' : 'Enviar original' }}
              </button>
              <button
                type="button"
                @click="uploadCurrentCropped"
                :disabled="isCropUploading"
                class="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {{ isCropUploading ? 'Enviando...' : 'Recortar e enviar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Copy, Pencil, Trash2, Upload, X } from 'lucide-vue-next'
import { Cropper, RectangleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { R2Service } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'

const toast = useToastStore()
const dialog = useDialogStore()

const prefix = ref('')
const files = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isBulkDeleting = ref(false)
const isCropUploading = ref(false)
const uploadQueue = ref([])
const continuationToken = ref(null)
const hasMore = ref(false)
const selectedFileKey = ref(null)
const selectedKeys = ref([])
const cropQueue = ref([])
const cropQueueIdx = ref(0)
const cropperRef = ref(null)
const cropAspect = ref('free')
let prefixDebounceTimer = null

const cropAspectOptions = [
  { value: 'free', label: 'Livre' },
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
]

const selectedFile = computed(() => files.value.find((file) => file.key === selectedFileKey.value) || null)
const hasSelectedFiles = computed(() => selectedKeys.value.length > 0)
const allVisibleSelected = computed(
  () => files.value.length > 0 && files.value.every((file) => selectedKeys.value.includes(file.key)),
)
const currentCropItem = computed(() => cropQueue.value[cropQueueIdx.value] || null)
const cropStencilProps = computed(() => {
  if (cropAspect.value === 'free') return {}
  const [w, h] = cropAspect.value.split(':').map(Number)
  if (!w || !h) return {}
  return { aspectRatio: w / h }
})

onMounted(loadFiles)
onUnmounted(() => {
  clearCropQueue()
  if (prefixDebounceTimer) {
    clearTimeout(prefixDebounceTimer)
    prefixDebounceTimer = null
  }
})

watch(prefix, () => {
  if (prefixDebounceTimer) clearTimeout(prefixDebounceTimer)
  prefixDebounceTimer = setTimeout(() => {
    loadFiles()
  }, 300)
})

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
    syncSelectedKeysWithFiles()
    ensureSelectedFile()
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
    syncSelectedKeysWithFiles()
    ensureSelectedFile()
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao paginar arquivos.')
  } finally {
    isLoadingMore.value = false
  }
}

function ensureSelectedFile() {
  if (!files.value.length) {
    selectedFileKey.value = null
    return
  }

  const stillExists = files.value.some((item) => item.key === selectedFileKey.value)
  if (!selectedFileKey.value || !stillExists) {
    selectedFileKey.value = files.value[0].key
  }
}

function syncSelectedKeysWithFiles() {
  const visibleKeys = new Set(files.value.map((file) => file.key))
  selectedKeys.value = selectedKeys.value.filter((key) => visibleKeys.has(key))
}

function isSelected(key) {
  return selectedKeys.value.includes(key)
}

function toggleSelectFile(key) {
  if (isSelected(key)) {
    selectedKeys.value = selectedKeys.value.filter((item) => item !== key)
    return
  }
  selectedKeys.value = [...selectedKeys.value, key]
}

function toggleSelectAll(event) {
  if (event.target.checked) {
    selectedKeys.value = Array.from(new Set([...selectedKeys.value, ...files.value.map((file) => file.key)]))
    return
  }
  const visibleKeys = new Set(files.value.map((file) => file.key))
  selectedKeys.value = selectedKeys.value.filter((key) => !visibleKeys.has(key))
}

function isImageFile(file) {
  if (!file?.url && !file?.key) return false
  const raw = String(file.url || file.key).split('?')[0].toLowerCase()
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(raw)
}

async function onPickFiles(event) {
  const selected = Array.from(event.target.files || [])
  event.target.value = ''
  if (!selected.length) return

  clearCropQueue()
  cropQueue.value = selected.map((file) => ({
    file,
    name: file.name,
    preview: URL.createObjectURL(file),
  }))
  cropQueueIdx.value = 0
  cropAspect.value = 'free'
}

function clearCropQueue() {
  cropQueue.value.forEach((item) => {
    if (item.preview) URL.revokeObjectURL(item.preview)
  })
  cropQueue.value = []
  cropQueueIdx.value = 0
}

function cancelCropQueue() {
  if (isCropUploading.value) return
  clearCropQueue()
}

async function uploadCurrentOriginal() {
  const item = currentCropItem.value
  if (!item) return
  await uploadAndAdvance(item.file, item.name)
}

async function uploadCurrentCropped() {
  const item = currentCropItem.value
  if (!item) return

  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) {
    toast.error('Nao foi possivel aplicar o recorte.')
    return
  }

  const croppedFile = await canvasToFile(canvas, item.file)
  await uploadAndAdvance(croppedFile, item.name)
}

function canvasToFile(canvas, originalFile) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar imagem recortada'))
          return
        }

        const file = new File([blob], originalFile.name, {
          type: originalFile.type || 'image/jpeg',
          lastModified: Date.now(),
        })

        resolve(file)
      },
      originalFile.type || 'image/jpeg',
      0.92,
    )
  })
}

async function uploadAndAdvance(file, displayName) {
  isCropUploading.value = true

  const queueItem = {
    id: `${Date.now()}_${Math.random()}`,
    name: displayName,
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
    toast.success(`Arquivo enviado: ${displayName}`)
  } catch (error) {
    toast.error(error.response?.data?.error || `Falha ao enviar: ${displayName}`)
  } finally {
    isCropUploading.value = false
  }

  await nextCropItem()
}

async function nextCropItem() {
  if (cropQueueIdx.value + 1 < cropQueue.value.length) {
    cropQueueIdx.value += 1
    return
  }

  clearCropQueue()
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

async function removeSelectedFiles() {
  if (!selectedKeys.value.length) return

  const confirmed = await dialog.confirm({
    title: 'Excluir arquivos selecionados?',
    message: `Deseja realmente excluir ${selectedKeys.value.length} arquivo(s)? Essa acao nao pode ser desfeita.`,
    confirmLabel: 'Excluir todos',
    cancelLabel: 'Cancelar',
  })

  if (!confirmed) return

  isBulkDeleting.value = true

  try {
    const keysToDelete = [...selectedKeys.value]
    const results = await Promise.allSettled(keysToDelete.map((key) => R2Service.deleteFile(key)))
    const failedCount = results.filter((result) => result.status === 'rejected').length
    const successCount = keysToDelete.length - failedCount

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) removido(s) com sucesso.`)
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} arquivo(s) nao puderam ser removidos.`)
    }

    selectedKeys.value = []
    await loadFiles()
  } finally {
    isBulkDeleting.value = false
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
