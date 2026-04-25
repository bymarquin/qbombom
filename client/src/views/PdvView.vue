<template>
  <div
    class="h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden font-sans relative -m-8"
  >
    <!-- Área Principal -->
    <main class="h-full flex overflow-hidden">
      <!-- Lado Esquerdo: Menu e Produtos -->
      <section class="flex-1 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
        <!-- Busca + Categorias -->
        <div class="shrink-0 border-b border-neutral-100 dark:border-neutral-800/50">
          <div class="px-4 pt-3 pb-2">
            <div class="relative">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                ref="inputBusca"
                type="text"
                v-model="termoBusca"
                placeholder="Buscar produto..."
                class="w-full pl-10 pr-14 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
              <kbd class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 pointer-events-none">F2</kbd>
            </div>
          </div>
          <div class="flex overflow-x-auto gap-2 px-4 pb-3 no-scrollbar">
            <button
              v-for="categoria in categorias"
              :key="categoria.id"
              @click="categoriaAtiva = categoria.id"
              class="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              :class="
                categoriaAtiva === categoria.id
                  ? 'bg-red-600 text-white shadow-sm dark:shadow-none'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              "
            >
              {{ categoria.name }}
            </button>
          </div>
        </div>

        <!-- Grade de Produtos -->
        <div class="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-950 relative">
          <div
            v-if="loadingCatalog"
            class="absolute inset-0 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950/80 z-10 text-neutral-500 dark:text-neutral-500 font-medium"
          >
            Carregando cardápio...
          </div>

          <div
            v-else-if="produtosFiltrados.length === 0"
            class="flex flex-col items-center justify-center h-40 text-neutral-400"
          >
            <Search class="w-10 h-10 mb-2 opacity-20" />
            <p>Nenhum produto encontrado nesta categoria.</p>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <!-- Card de Produto -->
            <button
              v-for="produto in produtosFiltrados"
              :key="produto.id"
              class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 rounded-2xl p-4 flex flex-col text-left hover:border-red-600 shadow-sm dark:shadow-none shadow-neutral-200/50 hover:shadow-md dark:shadow-none hover:shadow-red-900/5 transition-all duration-200 group relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-red-600/15 disabled:opacity-60 disabled:cursor-wait"
              :disabled="loadingProduto"
              @click="abrirModalProduto(produto)"
            >
              <div class="w-full aspect-square rounded-xl mb-3 overflow-hidden">
                <img
                  v-if="produto.imageUrl"
                  :src="produto.imageUrl"
                  :alt="produto.name"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-red-50 flex items-center justify-center text-red-300 group-hover:bg-red-100 transition-colors"
                >
                  <Coffee class="w-8 h-8" />
                </div>
              </div>

              <h3
                class="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight mb-1 line-clamp-2"
              >
                {{ produto.name }}
              </h3>
              <p
                class="text-xs text-neutral-500 dark:text-neutral-500 mb-2 line-clamp-2 min-h-[32px]"
              >
                {{ produto.description }}
              </p>
              <div class="mt-auto pt-2 flex items-center justify-between">
                <span class="text-red-600 font-bold">{{ precoMinimoPdv(produto) }}</span>
                <div
                  class="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors"
                >
                  <Plus class="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- Lado Direito: Carrinho / Cupom -->
      <aside
        class="w-[380px] bg-white dark:bg-neutral-900 border-l border-neutral-100 dark:border-neutral-800/50 flex flex-col shrink-0 z-10 shadow-xl dark:shadow-none shadow-red-900/5"
      >
        <!-- Cabeçalho do Pedido -->
        <div class="p-5 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0">
          <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Pedido Atual
          </h2>

          <div class="flex flex-col gap-3">
            <div class="relative">
              <User class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                v-model="nomeCliente"
                placeholder="Nome do Cliente (Opcional)"
                class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
            </div>
            
            <div v-if="tipoConsumo === 'Entrega'" class="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
              <div class="relative">
                <Phone class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="tel"
                  :value="telefoneCliente"
                  @input="telefoneCliente = mascararTelefone($event.target.value)"
                  inputmode="numeric"
                  placeholder="WhatsApp do Cliente (Opcional)"
                  class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
                />
              </div>
              <div class="relative">
                <MapPin class="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                <textarea
                  v-model="enderecoEntrega"
                  rows="2"
                  placeholder="Endereço completo (Rua, nº, Bairro, Ref)"
                  class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 resize-none placeholder-neutral-400"
                ></textarea>
              </div>
            </div>

            <div class="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button
                class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
                :class="
                  tipoConsumo === 'Mesa'
                    ? 'bg-white dark:bg-neutral-900 text-red-600 shadow-sm dark:shadow-none'
                    : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 dark:text-neutral-300'
                "
                @click="tipoConsumo = 'Mesa'"
              >
                Mesa / Local
              </button>
              <button
                class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
                :class="
                  tipoConsumo === 'Viagem'
                    ? 'bg-white dark:bg-neutral-900 text-red-600 shadow-sm dark:shadow-none'
                    : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 dark:text-neutral-300'
                "
                @click="tipoConsumo = 'Viagem'"
              >
                Viagem
              </button>
              <button
                class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
                :class="
                  tipoConsumo === 'Entrega'
                    ? 'bg-white dark:bg-neutral-900 text-red-600 shadow-sm dark:shadow-none'
                    : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 dark:text-neutral-300'
                "
                @click="tipoConsumo = 'Entrega'"
              >
                Delivery
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Itens do Carrinho -->
        <div class="flex-1 overflow-y-auto p-5 bg-neutral-50 dark:bg-neutral-950">
          <div
            v-if="carrinho.length === 0"
            class="h-full flex flex-col items-center justify-center text-center text-neutral-400 gap-3"
          >
            <ShoppingCart class="w-12 h-12 opacity-20" />
            <p class="text-sm">O carrinho está vazio.<br />Selecione produtos ao lado.</p>
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="(item, index) in carrinho"
              :key="index"
              class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 p-3.5 rounded-2xl shadow-sm dark:shadow-none shadow-neutral-200/50 relative group transition-all duration-200"
            >
              <div class="flex justify-between items-start gap-2 mb-2">
                <div class="flex-1">
                  <h4
                    class="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-tight"
                  >
                    {{ item.quantity }}x {{ item.productName }}
                  </h4>
                  <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
                    {{ item.variationName || 'Único' }}
                  </p>
                </div>
                <span class="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{{
                  formatarMoeda(item.totalPrice * item.quantity)
                }}</span>
              </div>

              <div
                v-if="item.selectedAdditionals.length"
                class="text-xs text-neutral-500 dark:text-neutral-500 mb-2 pl-1 space-y-0.5"
              >
                <template v-for="group in groupAdditionals(item.selectedAdditionals)" :key="group.name">
                  <p v-if="group.name" class="font-semibold text-neutral-600 dark:text-neutral-400 mt-1">{{ group.name }}:</p>
                  <p v-for="(add, i) in group.items" :key="i" class="pl-1">
                    {{ add.name }}<span v-if="add.price > 0" class="text-neutral-400"> (+{{ formatarMoeda(add.price) }})</span>
                  </p>
                </template>
              </div>

              <p
                v-if="item.observation"
                class="text-xs text-amber-600 bg-amber-50 p-1.5 rounded mb-2 flex items-start gap-1"
              >
                <MessageSquareWarning class="w-3 h-3 mt-0.5 shrink-0" />
                {{ item.observation }}
              </p>

              <div
                class="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50"
              >
                <button
                  @click="removerItem(index)"
                  class="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 class="w-3 h-3" /> Remover
                </button>

                <div class="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-md">
                  <button
                    class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-l-md"
                    @click="item.quantity > 1 ? item.quantity-- : null"
                  >
                    -
                  </button>
                  <span class="px-2 text-xs font-semibold w-6 text-center">{{
                    item.quantity
                  }}</span>
                  <button
                    class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-r-md"
                    @click="item.quantity++"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumo e Ações -->
        <div
          class="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0"
        >
          <div
            class="flex justify-between items-center mb-2 text-neutral-600 dark:text-neutral-400 text-sm"
          >
            <span>Subtotal</span>
            <span>{{ formatarMoeda(subtotal) }}</span>
          </div>

          <div class="flex justify-between items-end mb-6">
            <span class="font-bold text-neutral-900 dark:text-neutral-100">Total</span>
            <span class="text-2xl font-black text-red-600">{{ formatarMoeda(subtotal) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="abrirModalPagamento"
              :disabled="carrinho.length === 0 || salvandoPedido"
              class="col-span-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-base shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CreditCard class="w-5 h-5" v-if="!salvandoPedido" />
              <div
                v-else
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              {{ salvandoPedido ? 'Enviando...' : 'Cobrar e Produzir' }}
              <kbd v-if="!salvandoPedido" class="ml-1 text-[10px] font-mono bg-red-700/50 text-red-100 px-1.5 py-0.5 rounded border border-red-500/50">F9</kbd>
            </button>
            <button
              @click="limparPedido"
              class="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <XCircle class="w-4 h-4" />
              Limpar
              <kbd class="text-[10px] font-mono bg-red-100 text-red-400 px-1.5 py-0.5 rounded border border-red-200">F3</kbd>
            </button>
          </div>
        </div>
      </aside>
    </main>

    <!-- MODAL DE CONSTRUÇÃO DO PRODUTO -->
    <div
      v-if="modalAberto"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden"
      >
        <!-- Header do Modal -->
        <div
          class="flex justify-between items-center p-5 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0 bg-white dark:bg-neutral-900"
        >
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {{ produtoDetalhado ? `Montar: ${produtoDetalhado.name}` : 'Montar produto' }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-500">
              {{ loadingProduto ? 'Carregando detalhes...' : 'Selecione as opções desejadas' }}
            </p>
          </div>
          <button
            @click="fecharModalProduto"
            class="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Fechar
          </button>
        </div>

        <!-- Corpo do Modal (Scroll) -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 bg-neutral-50 dark:bg-neutral-950">
          <div v-if="loadingProduto" class="h-56 flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            Carregando produto...
          </div>

          <div
            v-else-if="erroProdutoDetalhe"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <p class="text-sm font-semibold text-red-700 dark:text-red-400">Não foi possível carregar os detalhes.</p>
            <p class="text-xs text-red-600 dark:text-red-500 mt-1">{{ erroProdutoDetalhe }}</p>
            <button
              @click="recarregarProdutoDetalhado"
              class="mt-3 px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>

          <template v-else-if="produtoDetalhado">
          <!-- Imagem do produto -->
          <div v-if="produtoDetalhado.imageUrl" class="w-full h-48 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 -mt-1">
            <img :src="produtoDetalhado.imageUrl" :alt="produtoDetalhado.name" class="w-full h-full object-cover" />
          </div>

          <!-- Stepper de bolas (sorvete) -->
          <section v-if="isSorvete">
            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <ArrowRightCircle class="w-4 h-4 text-red-600" />
              Bolas de Sorvete
              <span class="text-xs font-normal text-neutral-500 dark:text-neutral-400">(Obrigatório)</span>
            </h3>
            <div class="flex items-center justify-between p-4 rounded-xl border border-red-600 ring-1 ring-red-600 bg-red-50 dark:bg-red-900/20">
              <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {{ bolaCount }} {{ bolaCount === 1 ? 'Bola' : 'Bolas' }}
              </span>
              <div class="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-md">
                <button class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-l-md disabled:opacity-40"
                  :disabled="bolaCount <= 1" @click="bolaCount > 1 && bolaCount--">−</button>
                <span class="px-2 text-xs font-semibold w-6 text-center">{{ bolaCount }}</span>
                <button class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-r-md"
                  @click="bolaCount++">+</button>
              </div>
              <span class="font-bold text-red-600">{{ formatarMoeda(bolaPrice) }}</span>
            </div>
            <p class="text-xs text-neutral-400 mt-2">1ª bola R$4,00 • a partir da 2ª R$3,50/bola</p>
          </section>

          <!-- Produto por peso -->
          <section v-else-if="produtoDetalhado.weightBased">
            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <ArrowRightCircle class="w-4 h-4 text-red-600" />
              Valor (R$)
              <span class="text-xs font-normal text-neutral-500 dark:text-neutral-400">(Obrigatório)</span>
            </h3>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">R$</span>
              <input
                v-model.number="pesoGramas"
                type="number"
                :min="produtoDetalhado.minPrice || 0"
                step="0.01"
                placeholder="0,00"
                class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400"
              />
            </div>
            <p v-if="pesoGramas > 0 && produtoDetalhado.pricePerKg > 0" class="text-sm font-bold text-red-600 mt-2">
              ≈ {{ calcularPeso(pesoGramas, produtoDetalhado.pricePerKg) }}
            </p>
            <p v-if="produtoDetalhado.minPrice > 0" class="text-xs text-neutral-400 mt-2">
              Valor mínimo: {{ formatarMoeda(produtoDetalhado.minPrice) }} • R${{ produtoDetalhado.pricePerKg }}/kg
            </p>
            <p v-if="pesoGramas > 0 && pesoGramas < produtoDetalhado.minPrice" class="text-xs text-red-500 mt-1 font-medium">
              Valor mínimo é {{ formatarMoeda(produtoDetalhado.minPrice) }}.
            </p>
          </section>

          <!-- Tamanhos/Variações normais -->
          <section v-else-if="produtoDetalhado.variations && produtoDetalhado.variations.length > 0">
            <h3
              class="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2"
            >
              <ArrowRightCircle class="w-4 h-4 text-red-600" />
              Escolha a Opção
              <span class="text-xs font-normal text-neutral-500 dark:text-neutral-400"
                >(Obrigatório)</span
              >
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                v-for="tam in produtoDetalhado.variations"
                :key="tam.id"
                @click="tamanhoSelecionado = tam"
                class="p-4 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1"
                :class="
                  tamanhoSelecionado?.id === tam.id
                    ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 ring-1 ring-red-600'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-red-300 dark:hover:border-red-500/50 text-neutral-700 dark:text-neutral-300'
                "
              >
                <span class="font-bold">{{ tam.name }}</span>
                <span
                  class="text-sm font-semibold"
                  :class="
                    tamanhoSelecionado?.id === tam.id
                      ? 'text-red-600 dark:text-red-500'
                      : 'text-neutral-500 dark:text-neutral-400'
                  "
                >
                  {{ formatarMoeda(tam.price) }}
                </span>
              </button>
            </div>
            <p v-if="!tamanhoSelecionado" class="text-xs text-red-500 mt-2 font-medium">
              Selecione uma opção para continuar.
            </p>

            <!-- Contador global de complementos -->
            <div
              v-if="tamanhoSelecionado && limiteGlobal"
              class="mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <span class="text-xs text-neutral-500 dark:text-neutral-400">Complementos selecionados</span>
              <span
                class="text-xs font-bold"
                :class="atingiuLimite ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'"
              >
                {{ totalSelecionado }} / {{ limiteGlobal }}
              </span>
            </div>
          </section>


          <!-- Aviso para produto sem variações (preço zero) -->
          <section
            v-if="!isSorvete && (!produtoDetalhado.variations || produtoDetalhado.variations.length === 0)"
            class="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl"
          >
            <p class="text-sm font-semibold text-orange-700 dark:text-orange-400">Produto sem tamanho definido</p>
            <p class="text-xs text-orange-600 dark:text-orange-500 mt-1">Adicione pelo menos uma variação (tamanho) para definir o preço.</p>
          </section>

          <!-- Grupos de Adicionais -->
          <section v-for="grupo in produtoDetalhado.additionalGroups" :key="grupo.id">
            <div class="mb-3 flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <PlusCircle class="w-4 h-4 text-red-600" />
                  {{ grupo.name }}
                </h3>
                <p v-if="grupo.freeChoices > 0 && grupo.maxChoices !== 1" class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ grupo.freeChoices }} grátis
                </p>
              </div>
              <span
                v-if="grupo.stepperMode"
                class="text-xs font-semibold px-2 py-0.5 rounded border bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
              >
                Opcional
              </span>
              <span
                v-else-if="grupo.maxChoices === 1 && grupo.minChoices >= 1"
                class="text-xs font-semibold px-2 py-0.5 rounded border bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
              >
                Obrigatório
              </span>
              <span
                v-else-if="grupo.minChoices > 0"
                class="text-xs font-semibold px-2 py-1 rounded-md border"
                :class="qtdSelecionadaNoGrupo(grupo.id) < grupo.minChoices
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'"
              >
                {{ qtdSelecionadaNoGrupo(grupo.id) }} / {{ grupo.minChoices }}
              </span>
            </div>

            <!-- Stepper de casquinha -->
            <div v-if="grupo.stepperMode" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="add in grupo.items"
                :key="add.id"
                class="flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200"
                :class="(itemQuantidades[add.id] || 0) > 0
                  ? 'border-red-600 ring-1 ring-red-600 bg-red-50/30 dark:bg-red-900/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'"
              >
                <div>
                  <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ add.name }}</span>
                  <span class="text-xs text-neutral-400 ml-1">{{ formatarMoeda(add.price) }}/un</span>
                </div>
                <div class="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-md">
                  <button class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-l-md disabled:opacity-40"
                    :disabled="(itemQuantidades[add.id] || 0) === 0" @click="decrementarItem(add.id)">−</button>
                  <span class="px-2 text-xs font-semibold w-6 text-center">{{ itemQuantidades[add.id] || 0 }}</span>
                  <button class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-r-md"
                    @click="incrementarItem(add.id)">+</button>
                </div>
                <span class="text-xs font-bold w-12 text-right" :class="(itemQuantidades[add.id] || 0) > 0 ? 'text-red-600 dark:text-red-500' : 'text-neutral-300'">
                  {{ (itemQuantidades[add.id] || 0) > 0 ? formatarMoeda(add.price * (itemQuantidades[add.id] || 0)) : '—' }}
                </span>
              </div>
            </div>

            <!-- Seleção única (radio style) -->
            <div v-else-if="grupo.maxChoices === 1 && grupo.minChoices >= 1" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="add in grupo.items"
                :key="add.id"
                class="flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200 cursor-pointer"
                :class="isAdicionalSelecionado(add)
                  ? 'border-red-600 ring-1 ring-red-600 bg-red-50/30 dark:bg-red-900/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700'"
                @click="selecionarUnico(add, grupo)"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="radio"
                    :checked="isAdicionalSelecionado(add)"
                    class="w-4 h-4 accent-red-600 cursor-pointer pointer-events-none"
                    readonly
                  />
                  <span class="text-sm font-medium" :class="isAdicionalSelecionado(add) ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'">
                    {{ add.name }}
                  </span>
                </div>
                <span v-if="add.price > 0" class="text-xs font-bold" :class="isAdicionalSelecionado(add) ? 'text-red-600 dark:text-red-500' : 'text-neutral-400 dark:text-neutral-500'">
                  + {{ formatarMoeda(add.price) }}
                </span>
              </label>
              <p v-if="grupo.minChoices > 0 && qtdSelecionadaNoGrupo(grupo.id) === 0" class="col-span-2 text-xs text-red-500 font-medium">
                Selecione uma opção para continuar.
              </p>
            </div>

            <!-- Múltipla escolha (checkbox style) -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="add in grupo.items"
                :key="add.id"
                class="flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200 cursor-pointer"
                :class="[
                  isAdicionalSelecionado(add)
                    ? 'border-red-600 ring-1 ring-red-600 bg-red-50/30 dark:bg-red-900/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700',
                  estaBloqueado(add, grupo) ? 'opacity-50 cursor-not-allowed' : '',
                ]"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    :value="{ ...add, grupoId: grupo.id }"
                    v-model="adicionaisSelecionados"
                    class="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    :disabled="estaBloqueado(add, grupo)"
                  />
                  <span class="text-sm font-medium" :class="isAdicionalSelecionado(add) ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'">
                    {{ add.name }}
                  </span>
                </div>
                <span v-if="add.price > 0" class="text-xs font-bold" :class="isAdicionalSelecionado(add) ? 'text-red-600 dark:text-red-500' : 'text-neutral-400 dark:text-neutral-500'">
                  + {{ formatarMoeda(add.price) }}
                </span>
              </label>
            </div>
          </section>

          <!-- Observações -->
          <section>
            <h3
              class="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2"
            >
              <MessageSquare class="w-4 h-4 text-neutral-400" />
              Observações
            </h3>
            <textarea
              v-model="observacaoProduto"
              rows="2"
              placeholder="Digite aqui se tiver alguma observação..."
              class="w-full p-3.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 resize-none placeholder-neutral-400"
            ></textarea>
          </section>
          </template>
        </div>

        <!-- Footer do Modal -->
        <div
          class="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center shrink-0"
        >
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Total do item</p>
            <p class="text-2xl font-black text-red-600">{{ formatarMoeda(totalItemAtual) }}</p>
          </div>
          <div class="flex gap-3">
            <button
              @click="fecharModalProduto"
              class="px-6 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              @click="confirmarItem"
              :disabled="podeConfirmarProduto === false || loadingProduto || !produtoDetalhado || !!erroProdutoDetalhe"
              class="px-8 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
            >
              <Check class="w-5 h-5" />
              Adicionar
              <kbd class="text-[10px] font-mono bg-red-700/50 text-red-100 px-1.5 py-0.5 rounded border border-red-500/50">Enter</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE PAGAMENTO E FECHAMENTO -->
    <div
      v-if="modalPagamentoAberto"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        class="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md flex flex-col shadow-xl dark:shadow-none shadow-red-900/5 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center p-5 border-b border-neutral-100 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 shrink-0"
        >
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">Pagamento</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-500">
              Cobrar pedido antes de produzir
            </p>
          </div>
          <button
            @click="fecharModalPagamento"
            class="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Fechar
          </button>
        </div>

        <!-- Corpo -->
        <div class="p-5 sm:p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950">
          <!-- Resumo de Valores -->
          <div
            class="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center"
          >
            <p class="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-1">
              Total a Cobrar
            </p>
            <p class="text-3xl font-black text-red-600">{{ formatarMoeda(subtotal) }}</p>
          </div>

          <!-- Métodos de Pagamento -->
          <section>
            <h3
              class="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 text-sm uppercase tracking-wider"
            >
              Forma de Pagamento
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="metodo in metodosPagamento"
                :key="metodo"
                @click="metodoPagamentoSelecionado = metodo"
                class="p-3 rounded-xl border font-medium text-sm transition-all duration-200 text-center"
                :class="
                  metodoPagamentoSelecionado === metodo
                    ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-950 hover:border-neutral-300 dark:border-neutral-700'
                "
              >
                {{ metodo }}
              </button>
            </div>
          </section>

          <div
            v-if="metodoPagamentoSelecionado === 'Dinheiro'"
            class="animate-in fade-in slide-in-from-top-2"
          >
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block"
              >Troco para (Opcional)</label
            >
            <input
              type="number"
              placeholder="R$ 0,00"
              class="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15"
            />
          </div>
        </div>

        <!-- Tela de confirmação PIX -->
        <div v-if="aguardandoPix" class="p-6 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-2">
          <div class="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock class="w-8 h-8 text-orange-500" />
          </div>
          <div class="text-center">
            <p class="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Aguardando PIX</p>
            <p class="text-3xl font-black text-red-600 mt-1">{{ formatarMoeda(subtotal) }}</p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Confirme após receber o pagamento</p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="p-5 border-t border-neutral-100 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 flex justify-between gap-3 shrink-0"
        >
          <button
            @click="cancelarPedido"
            class="px-4 py-2.5 font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Trash2 class="w-4 h-4" />
            Cancelar Pedido
          </button>
          <div class="flex gap-3">
            <button
              @click="aguardandoPix ? (aguardandoPix = false) : fecharModalPagamento()"
              class="px-5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Voltar
            </button>
            <button
              v-if="!aguardandoPix"
              @click="finalizarPagarDepois"
              :disabled="salvandoPedido"
              class="px-5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Pagar Depois
            </button>
            <button
              v-if="!aguardandoPix"
              @click="metodoPagamentoSelecionado === 'PIX' ? (aguardandoPix = true) : finalizarPedido()"
              :disabled="salvandoPedido"
              class="px-6 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-sm dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
            >
              Confirmar e Enviar
              <kbd class="text-[10px] font-mono bg-red-700/50 text-red-100 px-1.5 py-0.5 rounded border border-red-500/50">Enter</kbd>
            </button>
            <button
              v-else
              @click="finalizarPedido"
              :disabled="salvandoPedido"
              class="px-6 py-2.5 font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-sm dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
            >
              <div v-if="salvandoPedido" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <Check v-else class="w-5 h-5" />
              {{ salvandoPedido ? 'Finalizando...' : 'PIX Recebido — Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  User,
  ShoppingCart,
  Trash2,
  MessageSquareWarning,
  CreditCard,
  XCircle,
  Plus,
  Coffee,
  ArrowRightCircle,
  PlusCircle,
  MessageSquare,
  Check,
  Phone,
  MapPin,
  Clock,
} from 'lucide-vue-next'
import { CatalogService, OrderService, AuthService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useDialogStore } from '@/stores/dialog'
import { useOrderSocket } from '@/composables/useOrderSocket'

import { formatarMoeda, mascararTelefone, limparTelefone } from '@/utils/formatters'

const groupAdditionals = (additionals) => {
  if (!additionals?.length) return []
  const map = new Map()
  for (const add of additionals) {
    const key = add.groupName || add.grupoName || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(add)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
}

const router = useRouter()
const toast = useToastStore()
const dialog = useDialogStore()
const inputBusca = ref(null)
const newOrderAlertSound = '/sounds/order-alert.mp3'
const PDV_ACTIVE_ORDERS_KEY = 'qbombom_pdv_pedidos_ativos'
const PDV_FINAL_STATUSES = new Set(['cancelado', 'finalizado'])

function getPdvActiveOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(PDV_ACTIVE_ORDERS_KEY) || '[]')
    return Array.isArray(orders) ? orders : []
  } catch {
    return []
  }
}

function savePdvActiveOrder(order) {
  if (!order?.id) return
  if (PDV_FINAL_STATUSES.has(order.status)) {
    removePdvActiveOrder(order.id)
    return
  }

  const orders = getPdvActiveOrders().filter((item) => item.id !== order.id)
  orders.unshift({
    id: order.id,
    trackingCode: order.trackingCode,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    type: order.type,
    customerName: order.customerName,
    total: order.total,
    items: order.items || [],
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  localStorage.setItem(PDV_ACTIVE_ORDERS_KEY, JSON.stringify(orders.slice(0, 20)))
}

function updatePdvActiveOrder(order) {
  if (!order?.id) return
  if (PDV_FINAL_STATUSES.has(order.status)) {
    removePdvActiveOrder(order.id)
    return
  }

  const orders = getPdvActiveOrders()
  const index = orders.findIndex((item) => item.id === order.id)
  if (index === -1) return

  orders[index] = {
    ...orders[index],
    trackingCode: order.trackingCode ?? orders[index].trackingCode,
    status: order.status ?? orders[index].status,
    paymentStatus: order.paymentStatus ?? orders[index].paymentStatus,
    paymentMethod: order.paymentMethod ?? orders[index].paymentMethod,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(PDV_ACTIVE_ORDERS_KEY, JSON.stringify(orders))
}

function removePdvActiveOrder(orderId) {
  if (!orderId) return
  const orders = getPdvActiveOrders().filter((item) => item.id !== orderId)
  localStorage.setItem(PDV_ACTIVE_ORDERS_KEY, JSON.stringify(orders))
}

function playNewOrderAlert() {
  const audio = new Audio(newOrderAlertSound)
  audio.volume = 0.35
  audio.play().catch(() => {})
}

function onOrderCreated() {
  playNewOrderAlert()
}

function onOrderUpdated(order) {
  updatePdvActiveOrder(order)
}

useOrderSocket({ onCreated: onOrderCreated, onUpdated: onOrderUpdated })

// --- ESTADOS DO USUÁRIO E UI ---
const operadorNome = ref('Caixa')
const termoBusca = ref('')
const tipoConsumo = ref('Mesa')
const nomeCliente = ref('')
const telefoneCliente = ref('')
const enderecoEntrega = ref('')

// --- ESTADOS DO CATÁLOGO API ---
const categorias = ref([])
const categoriaAtiva = ref(null)
const loadingCatalog = ref(false)

const carregarCatalogo = async () => {
  loadingCatalog.value = true
  try {
    const { data } = await CatalogService.getCategories()
    categorias.value = data
    if (data.length > 0) {
      categoriaAtiva.value = data[0].id
    }
  } catch (err) {
    console.error('Erro ao carregar cardápio', err)
    if (err.response?.status === 401) {
      router.push('/login')
    }
  } finally {
    loadingCatalog.value = false
  }
}

const buscarUsuario = async () => {
  try {
    const { data } = await AuthService.getMe()
    operadorNome.value = data.name
  } catch (err) {
    console.error('Erro ao buscar operador:', err)
    router.push('/login')
  }
}

onMounted(() => {
  if (!AuthService.isAuthenticated()) {
    router.push('/login')
    return
  }
  buscarUsuario()
  carregarCatalogo()
  window.addEventListener('keydown', atalhosTeclado)
})


// Produtos da Categoria Ativa
const produtosFiltrados = computed(() => {
  const cat = categorias.value.find((c) => c.id === categoriaAtiva.value)
  if (!cat || !cat.products) return []

  let filtrados = cat.products
  if (termoBusca.value.trim()) {
    const termo = termoBusca.value.toLowerCase()
    filtrados = filtrados.filter((p) => p.name.toLowerCase().includes(termo))
  }
  return filtrados
})

const precoMinimoPdv = (produto) => {
  const prices = (produto.variations || []).map((v) => Number(v.price)).filter((p) => p > 0)
  return prices.length > 0 ? formatarMoeda(Math.min(...prices)) : 'Montar'
}

// --- CARRINHO ---
const CARRINHO_KEY = 'qbombom_pdv_carrinho'
const carrinho = ref((() => {
  try { return JSON.parse(localStorage.getItem(CARRINHO_KEY) || '[]') } catch { return [] }
})())
const salvandoPedido = ref(false)

watch(carrinho, (val) => {
  localStorage.setItem(CARRINHO_KEY, JSON.stringify(val))
}, { deep: true })

const subtotal = computed(() => {
  return carrinho.value.reduce((acc, item) => acc + item.totalPrice * item.quantity, 0)
})

const removerItem = (index) => {
  carrinho.value.splice(index, 1)
}

const limparPedido = () => {
  carrinho.value = []
  nomeCliente.value = ''
  telefoneCliente.value = ''
  enderecoEntrega.value = ''
}

const atalhosTeclado = (e) => {
  switch (e.key) {
    case 'F2':
      e.preventDefault()
      inputBusca.value?.focus()
      break
    case 'F9':
      e.preventDefault()
      if (!modalAberto.value && !modalPagamentoAberto.value) abrirModalPagamento()
      break
    case 'F3':
      e.preventDefault()
      if (!modalAberto.value && !modalPagamentoAberto.value) limparPedido()
      break
    case 'Escape':
      if (modalAberto.value) fecharModalProduto()
      else if (modalPagamentoAberto.value) fecharModalPagamento()
      break
    case 'Enter':
      if (e.target.tagName === 'TEXTAREA') break
      if (modalAberto.value && podeConfirmarProduto.value && !loadingProduto.value) confirmarItem()
      else if (modalPagamentoAberto.value && !salvandoPedido.value) {
        if (metodoPagamentoSelecionado.value === 'PIX' && !aguardandoPix.value) aguardandoPix.value = true
        else finalizarPedido()
      }
      break
  }
}

onUnmounted(() => window.removeEventListener('keydown', atalhosTeclado))

// --- PAGAMENTO E FECHAMENTO ---
const modalPagamentoAberto = ref(false)
const metodosPagamento = ['PIX', 'Crédito', 'Débito', 'Dinheiro']
const metodoPagamentoSelecionado = ref('PIX')
const aguardandoPix = ref(false)

const abrirModalPagamento = () => {
  if (carrinho.value.length === 0) return
  modalPagamentoAberto.value = true
}

const fecharModalPagamento = () => {
  modalPagamentoAberto.value = false
  metodoPagamentoSelecionado.value = 'PIX'
  aguardandoPix.value = false
}

const cancelarPedido = async () => {
  const confirmado = await dialog.confirm({
    title: 'Cancelar pedido?',
    message: 'Todos os itens do carrinho serão removidos. Essa ação não pode ser desfeita.',
    confirmLabel: 'Cancelar Pedido',
    cancelLabel: 'Voltar',
  })
  if (!confirmado) return
  limparPedido()
  fecharModalPagamento()
  toast.info('Pedido cancelado.')
}

const finalizarPagarDepois = async () => {
  if (carrinho.value.length === 0) return
  salvandoPedido.value = true
  try {
    const payload = {
      type: tipoConsumo.value,
      customerName: nomeCliente.value,
      customerPhone: tipoConsumo.value === 'Entrega' ? limparTelefone(telefoneCliente.value) : undefined,
      deliveryAddress: tipoConsumo.value === 'Entrega' ? enderecoEntrega.value : undefined,
      paymentStatus: 'pendente',
      paymentMethod: 'Pagar Depois',
      subtotal: subtotal.value,
      discount: 0,
      total: subtotal.value,
      items: carrinho.value.map((item) => ({
        productId: item.productId,
        productVariationId: item.variationId || null,
        variationName: item.variationName || null,
        quantity: item.quantity,
        unitPrice: item.totalPrice,
        totalPrice: item.totalPrice * item.quantity,
        observation: item.observation,
        selectedAdditionals: item.selectedAdditionals,
      })),
    }
    const { data } = await OrderService.createOrder(payload)
    savePdvActiveOrder(data)
    toast.success('Pedido enviado para a cozinha. Pagamento pendente.')
    carrinho.value = []
    nomeCliente.value = ''
    telefoneCliente.value = ''
    enderecoEntrega.value = ''
    fecharModalPagamento()
  } catch (err) {
    console.error(err)
    toast.error('Erro ao finalizar pedido. Tente novamente.')
  } finally {
    salvandoPedido.value = false
  }
}

const finalizarPedido = async () => {
  if (carrinho.value.length === 0) return
  salvandoPedido.value = true

  try {
    const payload = {
      type: tipoConsumo.value,
      customerName: nomeCliente.value,
      customerPhone: tipoConsumo.value === 'Entrega' ? limparTelefone(telefoneCliente.value) : undefined,
      deliveryAddress: tipoConsumo.value === 'Entrega' ? enderecoEntrega.value : undefined,
      paymentStatus: 'pago',
      paymentMethod: metodoPagamentoSelecionado.value,
      subtotal: subtotal.value,
      discount: 0,
      total: subtotal.value,
      items: carrinho.value.map((item) => ({
        productId: item.productId,
        productVariationId: item.variationId || null,
        variationName: item.variationName || null,
        quantity: item.quantity,
        unitPrice: item.totalPrice, // O totalPrice por 1 un é gravado como unitPrice
        totalPrice: item.totalPrice * item.quantity,
        observation: item.observation,
        selectedAdditionals: item.selectedAdditionals,
      })),
    }

    const { data } = await OrderService.createOrder(payload)
    savePdvActiveOrder(data)
    toast.success('Pedido cobrado e enviado para a cozinha com sucesso!')
    carrinho.value = []
    nomeCliente.value = ''
    telefoneCliente.value = ''
    enderecoEntrega.value = ''
    aguardandoPix.value = false
    fecharModalPagamento()
    

  } catch (err) {
    console.error(err)
    if (err.response?.status === 422) {
      carrinho.value = []
      fecharModalPagamento()
    } else {
      toast.error('Erro ao finalizar pedido. Tente novamente.')
    }
  } finally {
    salvandoPedido.value = false
  }
}

// --- LÓGICA DO MODAL DE MONTAGEM (COM DADOS DA API) ---
const modalAberto = ref(false)
const loadingProduto = ref(false)
const produtoDetalhado = ref(null)
const produtoSelecionadoId = ref(null)
const erroProdutoDetalhe = ref('')
const tamanhoSelecionado = ref(null)
const adicionaisSelecionados = ref([])
const observacaoProduto = ref('')
const bolaCount = ref(1)
const itemQuantidades = ref({})
const pesoGramas = ref(null)

const isWeightBased = computed(() => produtoDetalhado.value?.weightBased ?? false)

const calcularPeso = (preco, pricePerKg) => {
  const gramas = (preco / pricePerKg) * 1000
  return gramas >= 1000 ? `${(gramas / 1000).toFixed(2).replace('.', ',')} kg` : `${Math.round(gramas)} g`
}
const isSorvete = computed(() =>
  !isWeightBased.value &&
  (produtoDetalhado.value?.additionalGroups?.some(g => g.stepperMode) ?? false)
)
const bolaPrice = computed(() =>
  bolaCount.value === 1 ? 4.00 : bolaCount.value * 3.50
)
const incrementarItem = (itemId) => {
  itemQuantidades.value = { ...itemQuantidades.value, [itemId]: (itemQuantidades.value[itemId] || 0) + 1 }
}
const decrementarItem = (itemId) => {
  const atual = itemQuantidades.value[itemId] || 0
  if (atual > 0) itemQuantidades.value = { ...itemQuantidades.value, [itemId]: atual - 1 }
}
const casquinhaTotal = computed(() => {
  const grupo = produtoDetalhado.value?.additionalGroups?.find(g => g.stepperMode)
  if (!grupo) return 0
  return grupo.items.reduce((acc, item) => acc + Number(item.price) * (itemQuantidades.value[item.id] || 0), 0)
})

const carregarDetalhesProduto = async (produtoId) => {
  loadingProduto.value = true
  erroProdutoDetalhe.value = ''

  try {
    const { data } = await CatalogService.getProduct(produtoId, {}, { timeout: 30000 })
    produtoDetalhado.value = data
    tamanhoSelecionado.value = null
    adicionaisSelecionados.value = []
    observacaoProduto.value = ''
    bolaCount.value = 1
    itemQuantidades.value = {}
    pesoGramas.value = null
  } catch (err) {
    console.error('Erro ao carregar detalhes do produto:', err)
    if (err?.code === 'ECONNABORTED') {
      erroProdutoDetalhe.value = 'A API demorou para responder. Verifique conexão/API e tente novamente.'
    } else {
      erroProdutoDetalhe.value = err?.response?.data?.error || 'Tente novamente em instantes.'
    }
    toast.error('Não foi possível carregar o produto.')
  } finally {
    loadingProduto.value = false
  }
}

const abrirModalProduto = async (produtoSimples) => {
  produtoSelecionadoId.value = produtoSimples.id
  produtoDetalhado.value = {
    ...produtoSimples,
    variations: Array.isArray(produtoSimples.variations) ? produtoSimples.variations : [],
    additionalGroups: [],
  }
  modalAberto.value = true
  await carregarDetalhesProduto(produtoSimples.id)
}

const recarregarProdutoDetalhado = async () => {
  if (!produtoSelecionadoId.value) return
  await carregarDetalhesProduto(produtoSelecionadoId.value)
}

const fecharModalProduto = () => {
  modalAberto.value = false
  produtoDetalhado.value = null
  produtoSelecionadoId.value = null
  erroProdutoDetalhe.value = ''
}

const itensSelecionadosNoGrupo = (grupoId) => {
  return adicionaisSelecionados.value.filter((a) => a.grupoId === grupoId)
}
const qtdSelecionadaNoGrupo = (grupoId) => itensSelecionadosNoGrupo(grupoId).length

const isAdicionalSelecionado = (adicional) => {
  return adicionaisSelecionados.value.some((a) => a.id === adicional.id)
}

const atingiuMaximo = (grupo) => {
  return qtdSelecionadaNoGrupo(grupo.id) >= grupo.maxChoices
}

const limiteGlobal = computed(() => tamanhoSelecionado.value?.maxAdditionals ?? null)
const totalSelecionado = computed(() => adicionaisSelecionados.value.length)
const atingiuLimite = computed(() => limiteGlobal.value !== null && totalSelecionado.value >= limiteGlobal.value)

const estaBloqueado = (adicional, grupo) =>
  !isAdicionalSelecionado(adicional) && (atingiuLimite.value || atingiuMaximo(grupo))

const selecionarUnico = (add, grupo) => {
  adicionaisSelecionados.value = adicionaisSelecionados.value.filter((a) => a.grupoId !== grupo.id)
  adicionaisSelecionados.value.push({ ...add, grupoId: grupo.id })
}

watch(tamanhoSelecionado, () => {
  const max = limiteGlobal.value
  if (max !== null && adicionaisSelecionados.value.length > max) {
    adicionaisSelecionados.value = adicionaisSelecionados.value.slice(0, max)
  }
})

watch(() => adicionaisSelecionados.value.length, (novo, anterior) => {
  if (limiteGlobal.value !== null && novo === limiteGlobal.value && novo > anterior) {
    toast.info('Máximo de complementos atingido!')
  }
})

const podeConfirmarProduto = computed(() => {
  if (!produtoDetalhado.value) return false
  if (isWeightBased.value) {
    const min = Number(produtoDetalhado.value.minPrice) || 0
    return pesoGramas.value > 0 && pesoGramas.value >= min
  }
  if (!isSorvete.value && produtoDetalhado.value.variations?.length > 0 && !tamanhoSelecionado.value) return false
  if (produtoDetalhado.value.additionalGroups) {
    for (const grupo of produtoDetalhado.value.additionalGroups) {
      if (grupo.stepperMode) continue
      if (grupo.minChoices > 0 && qtdSelecionadaNoGrupo(grupo.id) < grupo.minChoices) return false
    }
  }
  return true
})

const adicionaisComPrecoCalculado = computed(() => {
  if (!produtoDetalhado.value?.additionalGroups) return []
  const processados = []
  for (const grupo of produtoDetalhado.value.additionalGroups) {
    if (grupo.stepperMode) continue
    const itensOrdenados = [...itensSelecionadosNoGrupo(grupo.id)].sort((a, b) => Number(a.price) - Number(b.price))
    itensOrdenados.forEach((item, index) => {
      processados.push({ id: item.id, name: item.name, price: index < grupo.freeChoices ? 0 : Number(item.price), groupName: grupo.name })
    })
  }
  return processados
})

const totalItemAtual = computed(() => {
  if (!produtoDetalhado.value) return 0
  if (isWeightBased.value) return (pesoGramas.value || 0) + adicionaisComPrecoCalculado.value.reduce((acc, curr) => acc + curr.price, 0)
  const base = isSorvete.value ? bolaPrice.value : (tamanhoSelecionado.value ? Number(tamanhoSelecionado.value.price) : 0)
  return base + casquinhaTotal.value + adicionaisComPrecoCalculado.value.reduce((acc, curr) => acc + curr.price, 0)
})

const confirmarItem = () => {
  if (!podeConfirmarProduto.value) return

  const casquinhaAdds = []
  if (isSorvete.value) {
    const grupo = produtoDetalhado.value.additionalGroups?.find(g => g.stepperMode)
    grupo?.items.forEach(item => {
      const qty = itemQuantidades.value[item.id] || 0
      if (qty > 0) casquinhaAdds.push({ id: item.id, name: `${item.name} ×${qty}`, price: Number(item.price) * qty, groupName: grupo.name })
    })
  }

  carrinho.value.push({
    productId: produtoDetalhado.value.id,
    productName: produtoDetalhado.value.name,
    variationId: (isSorvete.value || isWeightBased.value) ? null : (tamanhoSelecionado.value?.id ?? null),
    variationName: isWeightBased.value
      ? `${pesoGramas.value}g`
      : isSorvete.value
        ? `${bolaCount.value} ${bolaCount.value === 1 ? 'Bola' : 'Bolas'}`
        : (tamanhoSelecionado.value?.name ?? ''),
    quantity: 1,
    selectedAdditionals: [...adicionaisComPrecoCalculado.value, ...casquinhaAdds],
    observation: observacaoProduto.value,
    totalPrice: totalItemAtual.value,
  })

  toast.success(`${produtoDetalhado.value.name} adicionado ao carrinho!`)
  fecharModalProduto()
}
</script>
