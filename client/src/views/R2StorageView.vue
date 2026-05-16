<template>
  <div class="h-full flex flex-col font-sans">

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">Armazenamento</h1>
        <p class="text-sm text-neutral-500">Liste, envie e remova arquivos.</p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="loadFiles"
          :disabled="isLoading"
          title="Atualizar"
          class="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" />
        </button>

        <label class="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-red-700 active:scale-[0.98] shadow-sm cursor-pointer inline-flex items-center gap-2">
          <Upload class="w-4 h-4" />
          Enviar arquivos
          <input type="file" multiple class="hidden" @change="onPickFiles" />
        </label>
      </div>
    </header>

    <!-- Toolbar (busca + view toggle) -->
    <div class="flex items-center gap-3 mb-4 shrink-0">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          v-model="prefix"
          type="text"
          placeholder="Filtrar por pasta ou prefixo (ex: products)"
          class="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 transition-all"
          @keyup.enter="loadFiles"
        />
      </div>

      <!-- View toggle -->
      <div class="flex bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-1 gap-0.5 shrink-0">
        <button
          @click="viewMode = 'grid'"
          :class="viewMode === 'grid' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'"
          class="p-2 rounded-md transition-colors"
          title="Grade"
        >
          <LayoutGrid class="w-4 h-4" />
        </button>
        <button
          @click="viewMode = 'list'"
          :class="viewMode === 'list' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'"
          class="p-2 rounded-md transition-colors"
          title="Lista"
        >
          <List class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- File count info -->
    <p v-if="!isLoading && files.length > 0" class="text-xs text-neutral-400 dark:text-neutral-500 mb-3 shrink-0">
      {{ files.length }} arquivo(s){{ hasMore ? '+' : '' }}
    </p>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto min-h-0">

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center h-48">
        <div class="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="files.length === 0"
        class="flex flex-col items-center justify-center h-48 text-center gap-3 text-neutral-400 dark:text-neutral-500"
      >
        <FolderOpen class="w-12 h-12 opacity-40" />
        <p class="text-sm">Nenhum arquivo encontrado para este prefixo.</p>
      </div>

      <!-- GRID VIEW -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-24"
      >
        <div
          v-for="file in files"
          :key="file.key"
          class="group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-white dark:bg-neutral-900"
          :class="isSelected(file.key)
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'"
        >
          <!-- Checkbox (visible on hover or when selected) -->
          <div
            class="absolute top-2 left-2 z-10 transition-opacity"
            :class="isSelected(file.key) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            @click.stop
          >
            <input
              type="checkbox"
              :checked="isSelected(file.key)"
              @change="toggleSelectFile(file.key)"
              class="w-4 h-4 rounded accent-red-600 cursor-pointer shadow"
            />
          </div>

          <!-- Thumbnail or icon -->
          <div
            class="aspect-square bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden"
            @click="openPreview(file)"
          >
            <img
              v-if="isImageFile(file)"
              :src="file.url"
              :alt="fileName(file.key)"
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div v-else class="flex flex-col items-center gap-1 text-neutral-400">
              <FileIcon class="w-8 h-8" />
              <span class="text-[10px] uppercase font-medium tracking-wide">{{ fileExt(file.key) }}</span>
            </div>
          </div>

          <!-- File name + size -->
          <div class="px-2 py-2" @click="openPreview(file)">
            <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate" :title="file.key">
              {{ fileName(file.key) }}
            </p>
            <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{{ formatBytes(file.size) }}</p>
          </div>

          <!-- Hover actions -->
          <div
            class="absolute top-2 right-2 flex gap-1 transition-opacity"
            :class="isSelected(file.key) ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'"
          >
            <button
              @click.stop="copyUrl(file.url)"
              :disabled="!file.url"
              title="Copiar URL"
              class="w-6 h-6 rounded bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors disabled:opacity-30"
            >
              <Copy class="w-3 h-3" />
            </button>
            <button
              @click.stop="renameFile(file.key)"
              title="Renomear"
              class="w-6 h-6 rounded bg-black/60 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors"
            >
              <Pencil class="w-3 h-3" />
            </button>
            <button
              @click.stop="removeFile(file.key)"
              title="Excluir"
              class="w-6 h-6 rounded bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 overflow-hidden mb-24">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="text-xs uppercase text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/30">
              <th class="py-3 px-4 font-medium w-10">
                <input
                  type="checkbox"
                  :checked="allVisibleSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 rounded border-neutral-300 accent-red-600"
                  title="Selecionar todos"
                />
              </th>
              <th class="py-3 px-4 font-medium">Arquivo</th>
              <th class="py-3 px-4 font-medium hidden sm:table-cell">Tamanho</th>
              <th class="py-3 px-4 font-medium hidden md:table-cell">Modificado</th>
              <th class="py-3 px-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/50">
            <tr
              v-for="file in files"
              :key="file.key"
              @click="openPreview(file)"
              class="transition-colors cursor-pointer"
              :class="previewFile?.key === file.key
                ? 'bg-red-50/70 dark:bg-red-500/10'
                : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'"
            >
              <td class="py-3 px-4" @click.stop>
                <input
                  type="checkbox"
                  :checked="isSelected(file.key)"
                  @change="toggleSelectFile(file.key)"
                  class="w-4 h-4 rounded border-neutral-300 accent-red-600"
                />
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                    <img v-if="isImageFile(file)" :src="file.url" class="w-full h-full object-cover" loading="lazy" />
                    <FileIcon v-else class="w-4 h-4 text-neutral-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-neutral-900 dark:text-neutral-100 truncate text-sm" :title="file.key">{{ file.key }}</p>
                    <a v-if="file.url" :href="file.url" target="_blank" rel="noopener noreferrer" class="text-xs text-red-600 hover:underline" @click.stop>
                      Abrir URL
                    </a>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">{{ formatBytes(file.size) }}</td>
              <td class="py-3 px-4 text-neutral-500 dark:text-neutral-400 hidden md:table-cell text-xs">{{ formatDate(file.lastModified) }}</td>
              <td class="py-3 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button @click="copyUrl(file.url)" :disabled="!file.url" title="Copiar URL" class="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors">
                    <Copy class="w-4 h-4" />
                  </button>
                  <button @click="renameFile(file.key)" title="Renomear" class="p-1.5 rounded-md text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="removeFile(file.key)" title="Excluir" class="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && files.length > 0 && !isLoading" class="flex justify-center pb-6">
        <button
          @click="loadMoreFiles"
          :disabled="isLoadingMore"
          class="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {{ isLoadingMore ? 'Carregando...' : 'Carregar mais' }}
        </button>
      </div>
    </div>

    <!-- Bulk action bar (floating, bottom center) -->
    <Teleport to="body">
      <Transition name="bulk-bar">
        <div
          v-if="hasSelectedFiles"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl shadow-2xl px-5 py-3 border border-neutral-800 dark:border-neutral-200"
        >
          <span class="text-sm font-medium whitespace-nowrap">{{ selectedKeys.length }} selecionado(s)</span>
          <div class="w-px h-4 bg-neutral-700 dark:bg-neutral-300 shrink-0" />
          <button
            @click="removeSelectedFiles"
            :disabled="isBulkDeleting"
            class="text-sm font-semibold text-red-400 dark:text-red-600 hover:text-red-300 dark:hover:text-red-500 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {{ isBulkDeleting ? 'Excluindo...' : 'Excluir selecionados' }}
          </button>
          <button
            @click="selectedKeys = []"
            class="p-1 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-white dark:hover:text-neutral-900 transition-colors"
            title="Cancelar seleção"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Upload queue (floating, bottom right) -->
    <Teleport to="body">
      <Transition name="upload-queue">
        <div
          v-if="uploadQueue.length"
          class="fixed bottom-6 right-6 z-40 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0"></div>
            <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Enviando arquivos...</p>
          </div>
          <div class="p-4 space-y-3 max-h-48 overflow-y-auto">
            <div v-for="item in uploadQueue" :key="item.id">
              <div class="flex items-center justify-between text-xs mb-1 gap-2">
                <span class="text-neutral-600 dark:text-neutral-400 truncate">{{ item.name }}</span>
                <span class="text-neutral-400 shrink-0">{{ item.progress }}%</span>
              </div>
              <div class="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-150"
                  :class="item.progress === 100 ? 'bg-green-500' : 'bg-red-600'"
                  :style="{ width: `${item.progress}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Preview modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="previewFile" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="previewFile = null" />
          <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Modal header -->
            <div class="px-5 py-4 flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" :title="previewFile.key">
                  {{ fileName(previewFile.key) }}
                </p>
                <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{{ previewFile.key }}</p>
              </div>
              <button
                @click="previewFile = null"
                class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Preview content -->
            <div class="flex-1 overflow-auto min-h-0 bg-neutral-950/5 dark:bg-neutral-950/40 flex items-center justify-center p-4">
              <img
                v-if="isImageFile(previewFile)"
                :src="previewFile.url"
                :alt="previewFile.key"
                class="max-w-full max-h-[55vh] object-contain rounded-lg"
                loading="lazy"
              />
              <div v-else class="flex flex-col items-center gap-3 py-10 text-neutral-400">
                <FileIcon class="w-16 h-16 opacity-40" />
                <p class="text-sm">Arquivo não pode ser pré-visualizado.</p>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
              <div class="text-xs text-neutral-400 dark:text-neutral-500 space-y-0.5">
                <p>{{ formatBytes(previewFile.size) }}</p>
                <p>{{ formatDate(previewFile.lastModified) }}</p>
              </div>
              <div class="flex gap-2">
                <button
                  @click="copyUrl(previewFile.url)"
                  :disabled="!previewFile.url"
                  class="px-3 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <Copy class="w-4 h-4" />
                  Copiar URL
                </button>
                <a
                  v-if="previewFile.url"
                  :href="previewFile.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink class="w-4 h-4" />
                  Abrir
                </a>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Crop modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="cropQueue.length > 0" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="cancelCropQueue" />
          <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div class="px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h4 class="font-bold text-neutral-900 dark:text-neutral-100">
                  Recortar antes do upload
                  <span class="ml-2 text-xs font-normal text-neutral-400">({{ cropQueueIdx + 1 }} de {{ cropQueue.length }})</span>
                </h4>
                <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Escolha o formato ou mantenha livre</p>
              </div>
              <button type="button" @click="cancelCropQueue" class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
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
                :class="cropAspect === option.value
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
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
import { Copy, ExternalLink, FileIcon, FolderOpen, LayoutGrid, List, Pencil, RefreshCw, Search, Trash2, Upload, X } from 'lucide-vue-next'
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
const selectedKeys = ref([])
const previewFile = ref(null)
const viewMode = ref('grid')
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
  if (prefixDebounceTimer) clearTimeout(prefixDebounceTimer)
})

watch(prefix, () => {
  if (prefixDebounceTimer) clearTimeout(prefixDebounceTimer)
  prefixDebounceTimer = setTimeout(loadFiles, 300)
})

function fileName(key) {
  const parts = String(key).split('/')
  return parts[parts.length - 1] || key
}

function fileExt(key) {
  const name = fileName(key)
  const dot = name.lastIndexOf('.')
  return dot !== -1 ? name.slice(dot + 1) : ''
}

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

function isImageFile(file) {
  if (!file?.url && !file?.key) return false
  const raw = String(file.url || file.key).split('?')[0].toLowerCase()
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(raw)
}

function openPreview(file) {
  previewFile.value = file
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
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao paginar arquivos.')
  } finally {
    isLoadingMore.value = false
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
    selectedKeys.value = Array.from(new Set([...selectedKeys.value, ...files.value.map((f) => f.key)]))
    return
  }
  const visibleKeys = new Set(files.value.map((f) => f.key))
  selectedKeys.value = selectedKeys.value.filter((k) => !visibleKeys.has(k))
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
        if (!blob) { reject(new Error('Falha ao gerar imagem recortada')); return }
        resolve(new File([blob], originalFile.name, { type: originalFile.type || 'image/jpeg', lastModified: Date.now() }))
      },
      originalFile.type || 'image/jpeg',
      0.92,
    )
  })
}

async function uploadAndAdvance(file, displayName) {
  isCropUploading.value = true
  const queueItem = { id: `${Date.now()}_${Math.random()}`, name: displayName, progress: 0 }
  uploadQueue.value.push(queueItem)
  try {
    await R2Service.uploadFile(
      { file, prefix: prefix.value },
      {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return
          queueItem.progress = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total))
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
    if (previewFile.value?.key === key) previewFile.value = null
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
    const failedCount = results.filter((r) => r.status === 'rejected').length
    const successCount = keysToDelete.length - failedCount
    if (successCount > 0) toast.success(`${successCount} arquivo(s) removido(s) com sucesso.`)
    if (failedCount > 0) toast.error(`${failedCount} arquivo(s) nao puderam ser removidos.`)
    selectedKeys.value = []
    if (previewFile.value && keysToDelete.includes(previewFile.value.key)) previewFile.value = null
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
  const destinationInput = window.prompt('Informe o novo caminho ou nome do arquivo:', sourceKey)
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

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bulk-bar-enter-from,
.bulk-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.upload-queue-enter-active,
.upload-queue-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.upload-queue-enter-from,
.upload-queue-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
