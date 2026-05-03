<template>
  <div class="h-full flex flex-col font-sans">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tracking-tight">
          {{ isEditing ? 'Editar Produto' : 'Novo Produto' }}
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-500">
          {{ isEditing ? 'Altere os dados do produto.' : 'Preencha os dados para criar um novo produto.' }}
        </p>
      </div>
      <RouterLink
        to="/app/produtos"
        class="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 self-start sm:self-auto"
      >
        Voltar
      </RouterLink>
    </header>

    <div class="flex-1 overflow-y-auto">
      <form @submit.prevent="saveProduct" class="w-full flex flex-col gap-5 pb-8">

        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-5">
          <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Informações básicas</h2>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome do Produto</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              placeholder="Ex: Açaí 300ml"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Descrição</label>
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 resize-none"
              placeholder="Ingredientes e detalhes..."
            ></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoria</label>
            <select
              v-model="form.categoryId"
              required
              class="w-full h-[42px] px-3.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 transition-all cursor-pointer dark:[color-scheme:dark]"
            >
              <option disabled value="">Selecione...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <input v-model="form.status" id="prod-status" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <label for="prod-status" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Produto Ativo</label>
          </div>
        </div>

        <!-- Imagens -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Imagens</h2>
              <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Primeira imagem é a capa · Arraste para reordenar</p>
            </div>
            <button
              type="button"
              @click="openStoragePicker"
              class="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <Plus class="w-4 h-4" />
              Selecionar do Armazenamento
            </button>
          </div>

          <!-- Grid de thumbnails -->
          <div v-if="imageList.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <div
              v-for="(img, idx) in imageList"
              :key="img._key"
              draggable="true"
              @dragstart="dragStart(idx)"
              @dragover.prevent="dragOver(idx)"
              @dragend="dragEnd"
              class="relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing"
              :class="[
                idx === 0 ? 'border-red-500 ring-2 ring-red-500/30' : 'border-neutral-200 dark:border-neutral-700',
                dragOverIdx === idx ? 'scale-105 border-indigo-500' : '',
              ]"
            >
              <img :src="img.preview || img.imageUrl" class="w-full h-full object-cover" draggable="false" />
              <div v-if="idx === 0" class="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Capa</div>
              <button
                type="button"
                @click="removeImage(idx)"
                class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
              >
                <X class="w-3 h-3" />
              </button>
            </div>

            <!-- Botão adicionar inline -->
            <button
              type="button"
              @click="openStoragePicker"
              class="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-600 cursor-pointer flex items-center justify-center transition-colors bg-neutral-50 dark:bg-neutral-950/30"
            >
              <Plus class="w-6 h-6 text-neutral-400" />
            </button>
          </div>

          <!-- Dropzone vazio -->
          <button
            type="button"
            @click="openStoragePicker"
            v-else
            class="flex flex-col items-center justify-center gap-3 w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-600 rounded-xl cursor-pointer transition-colors bg-neutral-50 dark:bg-neutral-950/30 text-center px-6"
          >
            <div class="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <ImageIcon class="w-7 h-7 text-neutral-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Clique para selecionar imagens do armazenamento</p>
              <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Escolha arquivos já enviados no Cloudflare R2</p>
            </div>
          </button>

          <!-- Seletor de armazenamento -->
          <Teleport to="body">
            <Transition name="crop-modal">
              <div v-if="showStoragePicker" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="closeStoragePicker" />
                <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                  <div class="px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                      <h4 class="font-bold text-neutral-900 dark:text-neutral-100">Selecionar imagens do armazenamento</h4>
                      <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Marque uma ou mais imagens para adicionar ao produto</p>
                    </div>
                    <button type="button" @click="closeStoragePicker" class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <X class="w-5 h-5" />
                    </button>
                  </div>

                  <div class="px-6 pb-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <input
                      v-model="storagePrefix"
                      type="text"
                      placeholder="Prefixo (ex: products)"
                      class="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
                      @keyup.enter="loadStorageFiles({ force: true })"
                    />
                    <button
                      type="button"
                      @click="loadStorageFiles({ force: true })"
                      :disabled="isLoadingStorage"
                      class="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {{ isLoadingStorage ? 'Carregando...' : 'Buscar' }}
                    </button>
                  </div>

                  <div class="px-6 pb-6 flex-1 overflow-auto">
                    <div v-if="storageFiles.length === 0" class="h-full min-h-44 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                      Nenhuma imagem encontrada neste prefixo.
                    </div>

                    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <label
                        v-for="file in storageFiles"
                        :key="file.key"
                        class="group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all"
                        :class="storageSelection.includes(file.key) ? 'border-red-500 ring-2 ring-red-500/25' : 'border-neutral-200 dark:border-neutral-700 hover:border-red-400'"
                      >
                        <input
                          type="checkbox"
                          class="absolute top-2 left-2 z-10 w-4 h-4 accent-red-600"
                          :checked="storageSelection.includes(file.key)"
                          @change="toggleStorageSelection(file.key)"
                        />
                        <img
                          :src="file.url"
                          :alt="file.key"
                          class="w-full aspect-square object-cover"
                          loading="lazy"
                          decoding="async"
                          fetchpriority="low"
                        />
                        <div class="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] px-2 py-1 truncate">{{ file.key }}</div>
                      </label>
                    </div>

                  </div>

                  <div class="px-6 py-4 flex items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ storageSelection.length }} selecionada(s)</p>
                    <div class="flex gap-3 ml-auto">
                      <button type="button" @click="closeStoragePicker" class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        Cancelar
                      </button>
                      <button type="button" @click="addSelectedStorageImages" class="px-5 py-2 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 active:scale-95 transition-all">
                        Adicionar sem recorte
                      </button>
                      <button
                        type="button"
                        @click="startCroppingSelectedStorageImages"
                        :disabled="isPreparingCrop"
                        class="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {{ isPreparingCrop ? 'Preparando...' : 'Recortar e adicionar' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>

          <!-- Crop modal (com fila) -->
          <Teleport to="body">
            <Transition name="crop-modal">
              <div v-if="cropQueue.length > 0" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="cancelCrop" />
                <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                  <div class="px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                      <h4 class="font-bold text-neutral-900 dark:text-neutral-100">
                        Ajustar imagem
                        <span v-if="cropQueue.length > 1" class="ml-2 text-xs font-normal text-neutral-400">({{ cropQueueIdx + 1 }} de {{ cropQueue.length }})</span>
                      </h4>
                      <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Escolha o formato de recorte e ajuste como quiser</p>
                    </div>
                    <button type="button" @click="cancelCrop" class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
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
                      :class="cropAspect === option.value ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
                    >
                      {{ option.label }}
                    </button>
                  </div>

                  <div class="bg-neutral-950 relative" style="height: 380px">
                    <Cropper
                      ref="cropperRef"
                      :src="currentCropImage"
                      :stencil-component="RectangleStencil"
                      :stencil-props="cropStencilProps"
                      :default-size="{ width: 280, height: 280 }"
                      class="w-full h-full"
                    />
                  </div>
                  <div class="px-6 py-4 flex items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button type="button" @click="skipCrop" class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      {{ cropQueueIdx + 1 < cropQueue.length ? 'Pular' : 'Usar original' }}
                    </button>
                    <div class="flex gap-3 ml-auto">
                      <button type="button" @click="cancelCrop" class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        Cancelar
                      </button>
                      <button type="button" @click="confirmCrop" class="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all">
                        {{ cropQueueIdx + 1 < cropQueue.length ? 'Recortar e continuar' : 'Recortar e adicionar' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>

        <!-- Variações -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Variações (tamanhos)</h2>
            <button type="button" @click="addVariation" class="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
          <div v-if="form.variations.length === 0" class="text-xs text-neutral-400 italic">
            Sem variações — o preço será definido pela primeira variação adicionada.
          </div>
          <div v-for="(variation, i) in form.variations" :key="i" class="flex items-center gap-2">
            <input v-model="variation.name" type="text" placeholder="Ex: 300ml" required class="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15" />
            <input v-model="variation.price" type="number" step="0.01" min="0" placeholder="Preço" required class="w-24 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15" />
            <input v-model="variation.maxAdditionals" type="number" min="0" placeholder="Máx comp." title="Máximo de complementos neste tamanho" class="w-24 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15" />
            <button type="button" @click="removeVariation(i)" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Estoque e peso -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 shadow-xl shadow-red-900/5 dark:shadow-none p-6 flex flex-col gap-4">
          <h2 class="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Estoque e precificação</h2>

          <div class="flex items-center gap-3">
            <input v-model="form.requiresPreparation" id="prod-requires-preparation" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <div>
              <label for="prod-requires-preparation" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Requer preparo</label>
              <p class="text-xs text-neutral-400 dark:text-neutral-500">Desmarque para produtos prontos (picolé, pote de sorvete) — o pedido vai direto para "Pronto"</p>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Disponível para</label>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" value="Mesa" v-model="form.allowedOrderTypes" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
                Local (Mesa)
              </label>
              <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" value="Viagem" v-model="form.allowedOrderTypes" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
                Viagem
              </label>
              <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" value="Entrega" v-model="form.allowedOrderTypes" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
                Entrega
              </label>
            </div>
            <p class="text-xs text-neutral-400 dark:text-neutral-500">Desmarque tipos que este produto não suporta (ex.: taças não saem para entrega)</p>
          </div>

          <div class="flex items-center gap-3">
            <input v-model="form.manageStock" id="prod-manage-stock" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <label for="prod-manage-stock" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Controlar Estoque</label>
          </div>
          <div v-if="form.manageStock" class="flex flex-col gap-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Quantidade em Estoque</label>
            <input v-model="form.stock" type="number" min="0" required class="w-40 px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400" placeholder="0" />
          </div>

          <div class="flex items-center gap-3">
            <input v-model="form.weightBased" id="prod-weight-based" type="checkbox" class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-red-600 cursor-pointer" />
            <label for="prod-weight-based" class="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Produto vendido por peso</label>
          </div>
          <div v-if="form.weightBased" class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Preço por KG (R$)</label>
              <input v-model.number="form.pricePerKg" type="number" min="0" step="0.01" placeholder="0,00" class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Valor mínimo (R$)</label>
              <input v-model.number="form.minPrice" type="number" min="0" step="0.01" placeholder="0,00" class="w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400" />
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/app/produtos" class="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors">
            Cancelar
          </RouterLink>
          <button type="submit" :disabled="salvando" class="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm hover:shadow-md">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import { Plus, X, Image as ImageIcon } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { Cropper, RectangleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { CatalogService, R2Service } from '@/services/http'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const isEditing = computed(() => !!route.params.id)
const salvando = ref(false)
const categories = shallowRef([])

const form = ref({
  name: '', description: '', categoryId: '', status: true,
  requiresPreparation: true,
  allowedOrderTypes: ['Mesa', 'Viagem', 'Entrega'],
  manageStock: false, stock: 0, variations: [],
  weightBased: false, pricePerKg: 0, minPrice: 0,
})

// imageList: [{_key, imageUrl, id?}]
// _key = único por item para o v-for
// id = presente se imagem já existe no servidor
const imageList = ref([])
const showStoragePicker = ref(false)
const isLoadingStorage = ref(false)
const storagePrefix = ref('')
const storageFiles = ref([])
const storageSelection = ref([])
const cropQueue = ref([])
const cropQueueIdx = ref(0)
const cropperRef = ref(null)
const cropAspect = ref('free')
const isPreparingCrop = ref(false)

const cropAspectOptions = [
  { value: 'free', label: 'Livre' },
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
]

const cropStencilProps = computed(() => {
  if (cropAspect.value === 'free') return {}
  const [w, h] = cropAspect.value.split(':').map(Number)
  if (!w || !h) return {}
  return { aspectRatio: w / h }
})

const currentCropImage = computed(() => cropQueue.value[cropQueueIdx.value]?.cropUrl || null)

let _keyCounter = 0
const makeKey = () => ++_keyCounter

const storageCache = new Map()

const normalizeStoragePrefix = (value) => String(value || '').trim().replace(/^\/+/, '').replace(/\/+$/, '')

onMounted(async () => {
  const catRes = await CatalogService.getCategories({ all: true })
  categories.value = catRes.data

  if (isEditing.value) {
    try {
      const { data } = await CatalogService.getProduct(route.params.id, { all: true })
      imageList.value = (data.images || [])
        .sort((a, b) => a.position - b.position)
        .map((img) => ({ _key: makeKey(), id: img.id, imageUrl: img.imageUrl, preview: img.imageUrl }))

      // fallback: se não tem images mas tem imageUrl legado
      if (imageList.value.length === 0 && data.imageUrl) {
        imageList.value = [{ _key: makeKey(), imageUrl: data.imageUrl, preview: data.imageUrl }]
      }

      form.value = {
        name: data.name,
        description: data.description || '',
        categoryId: data.categoryId,
        status: data.status,
        requiresPreparation: data.requiresPreparation ?? true,
        allowedOrderTypes: data.allowedOrderTypes ?? ['Mesa', 'Viagem', 'Entrega'],
        manageStock: data.manageStock || false,
        stock: data.stock || 0,
        variations: (data.variations || []).map((v) => ({ name: v.name, price: v.price, maxAdditionals: v.maxAdditionals ?? null })),
        weightBased: data.weightBased || false,
        pricePerKg: data.pricePerKg || 0,
        minPrice: data.minPrice || 0,
      }
    } catch {
      toast.error('Erro ao carregar produto')
      router.push('/app/produtos')
    }
  } else {
    form.value.categoryId = categories.value[0]?.id || ''
  }
})

onUnmounted(() => {
  clearCropQueue()
})

const openStoragePicker = async () => {
  showStoragePicker.value = true
  storageSelection.value = []

  const cacheKey = normalizeStoragePrefix(storagePrefix.value)
  const cached = storageCache.get(cacheKey)
  if (cached) {
    storageFiles.value = cached
    return
  }

  await loadStorageFiles()
}

const closeStoragePicker = () => {
  showStoragePicker.value = false
}

const loadStorageFiles = async ({ force = false } = {}) => {
  if (isLoadingStorage.value) return

  const cacheKey = normalizeStoragePrefix(storagePrefix.value)
  const cached = storageCache.get(cacheKey)
  if (cached && !force) {
    storageFiles.value = cached
    return
  }

  isLoadingStorage.value = true

  try {
    const { data } = await R2Service.listFiles({ prefix: cacheKey, maxKeys: 200 })
    const files = (data.files || []).filter((file) => file.url && isImageUrl(file.url))
    storageFiles.value = files
    storageCache.set(cacheKey, files)
  } catch (error) {
    toast.error(error.response?.data?.error || 'Erro ao carregar imagens do armazenamento')
  } finally {
    isLoadingStorage.value = false
  }
}

const toggleStorageSelection = (key) => {
  if (storageSelection.value.includes(key)) {
    storageSelection.value = storageSelection.value.filter((item) => item !== key)
  } else {
    storageSelection.value = [...storageSelection.value, key]
  }
}

const addSelectedStorageImages = () => {
  const selectedFiles = storageFiles.value.filter((file) => storageSelection.value.includes(file.key))
  if (!selectedFiles.length) {
    toast.warning('Selecione pelo menos uma imagem.')
    return
  }

  let addedCount = 0

  selectedFiles.forEach((file) => {
    const alreadyAdded = imageList.value.some((img) => img.imageUrl === file.url)
    if (alreadyAdded) return
    imageList.value.push({ _key: makeKey(), imageUrl: file.url, preview: file.url })
    addedCount += 1
  })

  if (addedCount === 0) {
    toast.warning('As imagens selecionadas já estão no produto.')
    return
  }

  toast.success(`${addedCount} imagem(ns) adicionada(s).`)
  closeStoragePicker()
}

const startCroppingSelectedStorageImages = async () => {
  const selectedFiles = storageFiles.value.filter((file) => storageSelection.value.includes(file.key))
  if (!selectedFiles.length) {
    toast.warning('Selecione pelo menos uma imagem.')
    return
  }

  isPreparingCrop.value = true

  try {
    const queueWithBlobs = (await Promise.all(selectedFiles.map(loadFileForCrop))).filter(Boolean)

    if (!queueWithBlobs.length) {
      toast.error('Nao foi possivel carregar as imagens para recorte.')
      return
    }

    cropQueue.value = queueWithBlobs
    cropQueueIdx.value = 0
    cropAspect.value = 'free'
    showStoragePicker.value = false
  } finally {
    isPreparingCrop.value = false
  }
}

const loadFileForCrop = async (file) => {
  try {
    const response = await R2Service.getFileBlob(file.key)
    const cropUrl = URL.createObjectURL(response.data)
    return {
      ...file,
      cropUrl,
    }
  } catch {
    toast.error(`Nao foi possivel abrir para recorte: ${file.key}`)
    return null
  }
}

const confirmCrop = () => {
  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) {
    toast.error('Nao foi possivel aplicar o recorte.')
    return
  }

  const base64 = canvas.toDataURL('image/jpeg', 0.92)
  imageList.value.push({
    _key: makeKey(),
    preview: base64,
    imageBase64: base64,
  })

  advanceCropQueue()
}

const skipCrop = () => {
  const current = cropQueue.value[cropQueueIdx.value]
  if (current?.url) {
    const alreadyAdded = imageList.value.some((img) => img.imageUrl === current.url)
    if (!alreadyAdded) {
      imageList.value.push({ _key: makeKey(), imageUrl: current.url, preview: current.url })
    }
  }

  advanceCropQueue()
}

const cancelCrop = () => {
  clearCropQueue()
}

const clearCropQueue = () => {
  cropQueue.value.forEach((item) => {
    if (item?.cropUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.cropUrl)
    }
  })
  cropQueue.value = []
  cropQueueIdx.value = 0
}

const advanceCropQueue = () => {
  if (cropQueueIdx.value + 1 < cropQueue.value.length) {
    cropQueueIdx.value += 1
    return
  }

  clearCropQueue()
  storageSelection.value = []
  toast.success('Imagens adicionadas ao produto.')
}

const isImageUrl = (url) => /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url)

const removeImage = (idx) => { imageList.value.splice(idx, 1) }

// Drag-to-reorder
const dragFromIdx = ref(null)
const dragOverIdx = ref(null)
const dragStart = (idx) => { dragFromIdx.value = idx }
const dragOver = (idx) => { dragOverIdx.value = idx }
const dragEnd = () => {
  if (dragFromIdx.value !== null && dragOverIdx.value !== null && dragFromIdx.value !== dragOverIdx.value) {
    const list = [...imageList.value]
    const [moved] = list.splice(dragFromIdx.value, 1)
    list.splice(dragOverIdx.value, 0, moved)
    imageList.value = list
  }
  dragFromIdx.value = null
  dragOverIdx.value = null
}

const addVariation = () => { form.value.variations.push({ name: '', price: 0, maxAdditionals: null }) }
const removeVariation = (i) => { form.value.variations.splice(i, 1) }

const saveProduct = async () => {
  salvando.value = true
  try {
    const images = imageList.value.map((img) => {
      if (img.id) return { id: img.id, imageUrl: img.imageUrl || img.preview }
      if (img.imageBase64) return { imageBase64: img.imageBase64 }
      return { imageUrl: img.imageUrl || img.preview }
    })
    const payload = { ...form.value, images }
    if (isEditing.value) {
      await CatalogService.updateProduct(route.params.id, payload)
      toast.success('Atualizado com sucesso!')
    } else {
      await CatalogService.createProduct(payload)
      toast.success('Criado com sucesso!')
    }
    router.push('/app/produtos')
  } catch {
    toast.error('Erro ao salvar produto')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.crop-modal-enter-active,
.crop-modal-leave-active {
  transition: opacity 0.2s ease;
}
.crop-modal-enter-active .relative,
.crop-modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.crop-modal-enter-from,
.crop-modal-leave-to {
  opacity: 0;
}
.crop-modal-enter-from .relative {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
