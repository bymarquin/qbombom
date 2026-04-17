<template>
  <div
    class="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden font-sans relative"
  >
    <!-- Topbar do PDV -->
    <header
      class="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 shrink-0"
    >
      <div class="flex items-center gap-4">
        <div class="flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="10" class="fill-red-600" />
            <text
              x="16"
              y="22"
              font-size="18"
              font-weight="900"
              fill="white"
              text-anchor="middle"
              font-family="system-ui, sans-serif"
            >
              Q
            </text>
          </svg>
        </div>
        <div>
          <h1
            class="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-none tracking-tight"
          >
            Frente de Caixa (PDV)
          </h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Caixa Aberto • Operador: {{ operadorNome }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            v-model="termoBusca"
            placeholder="Buscar produto..."
            class="pl-10 pr-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 placeholder-neutral-400 w-64"
          />
        </div>

        <button
          @click="fazerLogout"
          class="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut class="w-4 h-4" />
          Sair do PDV
        </button>
      </div>
    </header>

    <!-- Área Principal -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Lado Esquerdo: Menu e Produtos -->
      <section class="flex-1 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
        <!-- Categorias (Abas) -->
        <div
          class="flex overflow-x-auto gap-2 p-4 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0 no-scrollbar"
        >
          <button
            v-for="categoria in categorias"
            :key="categoria.id"
            @click="categoriaAtiva = categoria.id"
            class="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            :class="
              categoriaAtiva === categoria.id
                ? 'bg-red-600 text-white shadow-sm dark:shadow-none'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-700'
            "
          >
            {{ categoria.name }}
          </button>
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
              class="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/50 rounded-2xl p-4 flex flex-col text-left hover:border-red-600 shadow-sm dark:shadow-none shadow-neutral-200/50 hover:shadow-md dark:shadow-none hover:shadow-red-900/5 transition-all duration-200 group relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-red-600/15"
              @click="abrirModalProduto(produto)"
            >
              <div
                class="w-full h-24 bg-red-50 rounded-lg mb-3 flex items-center justify-center text-red-300 group-hover:bg-red-100 transition-colors"
              >
                <Coffee class="w-8 h-8" />
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
                <span class="text-red-600 font-bold">{{
                  produto.basePrice > 0 ? formatarMoeda(produto.basePrice) : 'Montar'
                }}</span>
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
                  type="text"
                  v-model="telefoneCliente"
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

              <ul
                v-if="item.selectedAdditionals.length"
                class="text-xs text-neutral-500 dark:text-neutral-500 mb-2 pl-3 list-disc space-y-0.5 marker:text-neutral-300"
              >
                <li v-for="(add, i) in item.selectedAdditionals" :key="i">
                  {{ add.name }}
                  <span v-if="add.price > 0" class="text-neutral-400"
                    >(+{{ formatarMoeda(add.price) }})</span
                  >
                </li>
              </ul>

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
                    class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-700 rounded-l-md"
                    @click="item.quantity > 1 ? item.quantity-- : null"
                  >
                    -
                  </button>
                  <span class="px-2 text-xs font-semibold w-6 text-center">{{
                    item.quantity
                  }}</span>
                  <button
                    class="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-700 rounded-r-md"
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
            </button>
            <button
              @click="carrinho = []; nomeCliente = ''; telefoneCliente = ''; enderecoEntrega = ''"
              class="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <XCircle class="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>
      </aside>
    </main>

    <!-- MODAL DE CONSTRUÇÃO DO PRODUTO -->
    <div
      v-if="modalAberto && produtoDetalhado"
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
              Montar: {{ produtoDetalhado.name }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-500">
              Selecione as opções desejadas
            </p>
          </div>
          <button
            @click="fecharModalProduto"
            class="p-2 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Corpo do Modal (Scroll) -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 bg-neutral-50 dark:bg-neutral-950">
          <!-- Tamanhos/Variações (Se existirem) -->
          <section v-if="produtoDetalhado.variations && produtoDetalhado.variations.length > 0">
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
          </section>

          <!-- Preço base do produto caso não tenha variações -->
          <section
            v-else-if="produtoDetalhado.basePrice > 0"
            class="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex justify-between items-center"
          >
            <span class="font-semibold text-neutral-900 dark:text-neutral-100">Preço Fixo</span>
            <span class="font-bold text-red-600">{{
              formatarMoeda(produtoDetalhado.basePrice)
            }}</span>
          </section>

          <!-- Grupos de Adicionais -->
          <section v-for="grupo in produtoDetalhado.additionalGroups" :key="grupo.id">
            <div class="mb-3 flex items-end justify-between">
              <div>
                <h3
                  class="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2"
                >
                  <PlusCircle class="w-4 h-4 text-red-600" />
                  {{ grupo.name }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  <span v-if="grupo.minChoices > 0">Mínimo: {{ grupo.minChoices }} | </span>
                  Máximo: {{ grupo.maxChoices }} opções
                  <span v-if="grupo.freeChoices > 0"> | ({{ grupo.freeChoices }} grátis)</span>
                </p>
              </div>
              <span
                class="text-xs font-medium px-2 py-1 rounded"
                :class="
                  qtdSelecionadaNoGrupo(grupo.id) < grupo.minChoices
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                "
              >
                {{ qtdSelecionadaNoGrupo(grupo.id) }} / {{ grupo.maxChoices }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="add in grupo.items"
                :key="add.id"
                class="flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200 cursor-pointer"
                :class="[
                  isAdicionalSelecionado(add)
                    ? 'border-red-600 ring-1 ring-red-600 bg-red-50/30 dark:bg-red-900/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700',
                  !isAdicionalSelecionado(add) && atingiuMaximo(grupo)
                    ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900/50'
                    : '',
                ]"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    :value="{ ...add, grupoId: grupo.id }"
                    v-model="adicionaisSelecionados"
                    class="w-4 h-4 text-red-600 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded focus:ring-red-600 cursor-pointer accent-red-600"
                    :disabled="!isAdicionalSelecionado(add) && atingiuMaximo(grupo)"
                  />
                  <span
                    class="text-sm font-medium"
                    :class="
                      isAdicionalSelecionado(add)
                        ? 'text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-700 dark:text-neutral-300'
                    "
                  >
                    {{ add.name }}
                  </span>
                </div>
                <span
                  v-if="add.price > 0"
                  class="text-xs font-bold"
                  :class="isAdicionalSelecionado(add) ? 'text-red-600 dark:text-red-500' : 'text-neutral-400 dark:text-neutral-500'"
                >
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
              placeholder="Ex: Sem tampa, enviar colher extra..."
              class="w-full p-3.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/15 resize-none placeholder-neutral-400"
            ></textarea>
          </section>
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
              class="px-6 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:bg-neutral-700 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              @click="confirmarItem"
              :disabled="podeConfirmarProduto === false"
              class="px-8 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
            >
              <Check class="w-5 h-5" />
              Adicionar
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
            class="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:bg-neutral-800 rounded-full transition-colors"
          >
            <X class="w-6 h-6" />
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

        <!-- Footer -->
        <div
          class="p-5 border-t border-neutral-100 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 flex justify-end gap-3 shrink-0"
        >
          <button
            @click="fecharModalPagamento"
            class="px-5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="finalizarPedido"
            :disabled="salvandoPedido"
            class="px-6 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
          >
            <div
              v-if="salvandoPedido"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
            {{ salvandoPedido ? 'Finalizando...' : 'Confirmar e Enviar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
  LogOut,
  X,
  ArrowRightCircle,
  PlusCircle,
  MessageSquare,
  Check,
  Phone,
  MapPin,
} from 'lucide-vue-next'
import { CatalogService, OrderService, AuthService } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { printReceipt } from '@/utils/printReceipt'

const router = useRouter()
const toast = useToastStore()

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
})

const fazerLogout = () => {
  AuthService.logout()
}

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

import { formatarMoeda } from "@/utils/formatters"

// --- CARRINHO ---
const carrinho = ref([])
const salvandoPedido = ref(false)

const subtotal = computed(() => {
  return carrinho.value.reduce((acc, item) => acc + item.totalPrice * item.quantity, 0)
})

const removerItem = (index) => {
  carrinho.value.splice(index, 1)
}

// --- PAGAMENTO E FECHAMENTO ---
const modalPagamentoAberto = ref(false)
const metodosPagamento = ['PIX', 'Crédito', 'Débito', 'Dinheiro']
const metodoPagamentoSelecionado = ref('PIX')

const abrirModalPagamento = () => {
  if (carrinho.value.length === 0) return
  modalPagamentoAberto.value = true
}

const fecharModalPagamento = () => {
  modalPagamentoAberto.value = false
  metodoPagamentoSelecionado.value = 'PIX'
}

const finalizarPedido = async () => {
  if (carrinho.value.length === 0) return
  salvandoPedido.value = true

  try {
    const payload = {
      type: tipoConsumo.value,
      customerName: nomeCliente.value,
      customerPhone: tipoConsumo.value === 'Entrega' ? telefoneCliente.value : undefined,
      deliveryAddress: tipoConsumo.value === 'Entrega' ? enderecoEntrega.value : undefined,
      paymentStatus: 'pago',
      paymentMethod: metodoPagamentoSelecionado.value,
      subtotal: subtotal.value,
      discount: 0,
      total: subtotal.value,
      items: carrinho.value.map((item) => ({
        productId: item.productId,
        productVariationId: item.variationId || null,
        quantity: item.quantity,
        unitPrice: item.totalPrice, // O totalPrice por 1 un é gravado como unitPrice
        totalPrice: item.totalPrice * item.quantity,
        observation: item.observation,
        selectedAdditionals: item.selectedAdditionals,
      })),
    }

    const res = await OrderService.createOrder(payload)
    toast.success('Pedido cobrado e enviado para a cozinha com sucesso!')
    carrinho.value = []
    nomeCliente.value = ''
    telefoneCliente.value = ''
    enderecoEntrega.value = ''
    fecharModalPagamento()
    
    // Automaticamente imprime a via da cozinha/balcão
    if (res && res.data) {
      printReceipt(res.data)
    }
  } catch (err) {
    console.error(err)
    toast.error('Erro ao finalizar pedido. Tente novamente.')
  } finally {
    salvandoPedido.value = false
  }
}

// --- LÓGICA DO MODAL DE MONTAGEM (COM DADOS DA API) ---
const modalAberto = ref(false)
const produtoDetalhado = ref(null) // Recebe o produto completo da API (com grupos e itens)
const tamanhoSelecionado = ref(null)
const adicionaisSelecionados = ref([])
const observacaoProduto = ref('')

const abrirModalProduto = async (produtoSimples) => {
  try {
    // Busca detalhes (Variações e Adicionais completos) na API
    const { data } = await CatalogService.getProduct(produtoSimples.id)
    produtoDetalhado.value = data
    tamanhoSelecionado.value = null
    adicionaisSelecionados.value = []
    observacaoProduto.value = ''
    modalAberto.value = true
  } catch (err) {
    console.error('Erro ao carregar detalhes do produto:', err)
  }
}

const fecharModalProduto = () => {
  modalAberto.value = false
  produtoDetalhado.value = null
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

// Validação dos mínimos obrigatórios
const podeConfirmarProduto = computed(() => {
  if (!produtoDetalhado.value) return false

  // Se tem variação, obriga a selecionar uma
  if (produtoDetalhado.value.variations && produtoDetalhado.value.variations.length > 0) {
    if (!tamanhoSelecionado.value) return false
  }

  // Verifica mínimos dos grupos
  if (produtoDetalhado.value.additionalGroups) {
    for (const grupo of produtoDetalhado.value.additionalGroups) {
      if (grupo.minChoices > 0 && qtdSelecionadaNoGrupo(grupo.id) < grupo.minChoices) {
        return false
      }
    }
  }

  return true
})

const adicionaisComPrecoCalculado = computed(() => {
  if (!produtoDetalhado.value || !produtoDetalhado.value.additionalGroups) return []
  const processados = []

  for (const grupo of produtoDetalhado.value.additionalGroups) {
    const itensDoGrupo = itensSelecionadosNoGrupo(grupo.id)

    // Regra: ordena do mais barato pro mais caro. Os gratuitos serão os mais baratos, pagando os caros (lucro da loja)
    const itensOrdenados = [...itensDoGrupo].sort((a, b) => Number(a.price) - Number(b.price))

    itensOrdenados.forEach((item, index) => {
      // Se index < quantidade grátis -> preço é 0
      const precoCalculado = index < grupo.freeChoices ? 0 : Number(item.price)
      processados.push({
        id: item.id,
        name: item.name,
        price: precoCalculado, // Preço final que o cliente pagou (0 ou valor cheio)
      })
    })
  }

  return processados
})

const totalItemAtual = computed(() => {
  if (!produtoDetalhado.value) return 0

  let base = tamanhoSelecionado.value
    ? Number(tamanhoSelecionado.value.price)
    : Number(produtoDetalhado.value.basePrice)

  const extras = adicionaisComPrecoCalculado.value.reduce((acc, curr) => acc + curr.price, 0)
  return base + extras
})

const confirmarItem = () => {
  if (!podeConfirmarProduto.value) return

  carrinho.value.push({
    productId: produtoDetalhado.value.id,
    productName: produtoDetalhado.value.name,
    variationId: tamanhoSelecionado.value ? tamanhoSelecionado.value.id : null,
    variationName: tamanhoSelecionado.value ? tamanhoSelecionado.value.name : '',
    quantity: 1,
    selectedAdditionals: [...adicionaisComPrecoCalculado.value],
    observation: observacaoProduto.value,
    totalPrice: totalItemAtual.value,
  })

  toast.success(`${produtoDetalhado.value.name} adicionado ao carrinho!`)
  fecharModalProduto()
}
</script>
