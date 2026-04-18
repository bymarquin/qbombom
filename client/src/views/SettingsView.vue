<template>
  <div class="h-full flex flex-col gap-6 pb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Configurações</h1>
        <p class="text-neutral-500 dark:text-neutral-400 mt-1">
          Gerencie o funcionamento e as preferências do seu estabelecimento
        </p>
      </div>
      <button
        @click="salvarConfiguracoes"
        :disabled="isSaving"
        class="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 font-medium transition-colors flex items-center gap-2"
      >
        <svg
          v-if="isSaving"
          class="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>{{ isSaving ? "Salvando..." : "Salvar Alterações" }}</span>
      </button>
    </div>

    <div class="flex flex-col md:flex-row gap-6 h-full min-h-0">
      <!-- Menu Lateral de Abas -->
      <div class="w-full md:w-64 flex-shrink-0 flex flex-col gap-1 overflow-y-auto pb-4 md:pb-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          class="w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3"
          :class="
            currentTab === tab.id
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900/30'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
          "
        >
          <div v-html="tab.icon" class="w-5 h-5 flex-shrink-0"></div>
          {{ tab.label }}
        </button>
      </div>

      <!-- Conteúdo da Aba Ativa -->
      <div
        class="flex-1 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800/60 p-6 md:p-8 overflow-y-auto"
      >
        <!-- Tab: Perfil da Loja -->
        <div v-show="currentTab === 'profile'" class="space-y-8 animate-fadeIn">
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Perfil do Estabelecimento
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Nome da Loja</label
                >
                <input
                  v-model="form.profile.name"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="Ex: Burguer King"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >CNPJ</label
                >
                <input
                  v-model="form.profile.cnpj"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Telefone/WhatsApp</label
                >
                <input
                  :value="form.profile.phone"
                  @input="form.profile.phone = mascararTelefone($event.target.value)"
                  type="tel"
                  inputmode="numeric"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Email de Contato</label
                >
                <input
                  v-model="form.profile.email"
                  type="email"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="contato@loja.com"
                />
              </div>
            </div>
          </div>

          <hr class="border-neutral-200 dark:border-neutral-800" />

          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Endereço</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-1 md:col-span-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >CEP</label
                >
                <input
                  v-model="form.profile.address.zip"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="00000-000"
                />
              </div>
              <div class="space-y-1 md:col-span-2">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Rua/Avenida</label
                >
                <input
                  v-model="form.profile.address.street"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="Nome da rua"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Número</label
                >
                <input
                  v-model="form.profile.address.number"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="123"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Bairro</label
                >
                <input
                  v-model="form.profile.address.neighborhood"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="Centro"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Cidade/UF</label
                >
                <input
                  v-model="form.profile.address.city"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="São Paulo - SP"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Horários -->
        <div v-show="currentTab === 'hours'" class="space-y-6 animate-fadeIn">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Horários de Funcionamento
            </h2>
            <div class="flex items-center gap-2">
              <span
                class="text-sm font-medium"
                :class="
                  form.hours.isOpen
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                "
              >
                {{ form.hours.isOpen ? "Loja Aberta Agora" : "Loja Fechada" }}
              </span>
              <button
                @click="form.hours.isOpen = !form.hours.isOpen"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                :class="form.hours.isOpen ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-700'"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="form.hours.isOpen ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="day in form.hours.schedule"
              :key="day.id"
              class="flex items-center justify-between p-4 rounded-xl border transition-colors"
              :class="
                day.active
                  ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30'
                  : 'border-neutral-100 dark:border-neutral-800/50 opacity-60'
              "
            >
              <div class="flex items-center gap-4 w-40">
                <input
                  type="checkbox"
                  v-model="day.active"
                  class="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-600"
                />
                <span class="font-medium text-neutral-900 dark:text-neutral-100">{{
                  day.name
                }}</span>
              </div>

              <div class="flex items-center gap-3 flex-1 justify-end" v-if="day.active">
                <input
                  v-model="day.open"
                  type="time"
                  class="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <span class="text-neutral-500">até</span>
                <input
                  v-model="day.close"
                  type="time"
                  class="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
              </div>
              <div class="flex-1 text-right text-sm text-neutral-500 dark:text-neutral-400" v-else>
                Fechado
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Taxas e Entrega -->
        <div v-show="currentTab === 'delivery'" class="space-y-8 animate-fadeIn">
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Configurações de Entrega
            </h2>
            <div class="space-y-6">
              <div
                class="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800"
              >
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="font-bold text-neutral-900 dark:text-neutral-100">
                      Retirada no Local
                    </h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                      Permitir que os clientes retirem o pedido no balcão
                    </p>
                  </div>
                  <button
                    @click="form.delivery.allowPickup = !form.delivery.allowPickup"
                    class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="
                      form.delivery.allowPickup
                        ? 'bg-red-600'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                    "
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="form.delivery.allowPickup ? 'translate-x-5' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="font-bold text-neutral-900 dark:text-neutral-100">
                  Taxa de Entrega Padrão
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >Tipo de Taxa</label
                    >
                    <select
                      v-model="form.delivery.feeType"
                      class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                    >
                      <option value="fixed">Valor Fixo</option>
                      <option value="distance">Por Distância (KM)</option>
                      <option value="neighborhood">Por Bairro</option>
                      <option value="free">Entrega Grátis</option>
                    </select>
                  </div>

                  <div class="space-y-1" v-if="form.delivery.feeType === 'fixed'">
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >Valor (R$)</label
                    >
                    <input
                      v-model="form.delivery.fixedFee"
                      type="number"
                      step="0.5"
                      class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      placeholder="5.00"
                    />
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="font-bold text-neutral-900 dark:text-neutral-100">Tempo Estimado</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="space-y-1">
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >Mínimo (min)</label
                    >
                    <input
                      v-model="form.delivery.estimatedTimeMin"
                      type="number"
                      class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      placeholder="30"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >Máximo (min)</label
                    >
                    <input
                      v-model="form.delivery.estimatedTimeMax"
                      type="number"
                      class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                      placeholder="45"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Pagamentos -->
        <div v-show="currentTab === 'payment'" class="space-y-6 animate-fadeIn">
          <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Métodos de Pagamento
          </h2>
          <p class="text-neutral-500 dark:text-neutral-400 mb-6">
            Selecione as formas de pagamento aceitas pelo seu estabelecimento.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(method, key) in form.payments"
              :key="key"
              class="flex items-center justify-between p-5 rounded-xl border transition-colors cursor-pointer"
              :class="
                method.active
                  ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              "
              @click="method.active = !method.active"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="
                    method.active
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                  "
                >
                  <div v-html="method.icon" class="w-5 h-5"></div>
                </div>
                <div>
                  <h4 class="font-bold text-neutral-900 dark:text-neutral-100">
                    {{ method.name }}
                  </h4>
                  <p class="text-xs text-neutral-500">{{ method.desc }}</p>
                </div>
              </div>
              <input
                type="checkbox"
                v-model="method.active"
                @click.stop
                class="w-5 h-5 text-red-600 rounded border-neutral-300 focus:ring-red-600 cursor-pointer"
              />
            </div>
          </div>

          <div
            v-if="form.payments.pix.active"
            class="mt-8 space-y-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30"
          >
            <h3 class="font-bold text-neutral-900 dark:text-neutral-100">
              Chave PIX (Recebimento)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Tipo de Chave</label
                >
                <select
                  v-model="form.pix.type"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Celular</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >Chave</label
                >
                <input
                  v-model="form.pix.key"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="Sua chave PIX"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Impressão -->
        <div v-show="currentTab === 'print'" class="space-y-6 animate-fadeIn">
          <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Configurações de Impressão
          </h2>

          <div class="space-y-4">
            <div class="space-y-1 max-w-sm">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Tamanho da Bobina</label
              >
              <select
                v-model="form.print.paperSize"
                class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              >
                <option value="80mm">80mm (Padrão)</option>
                <option value="58mm">58mm</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tab: WhatsApp -->
        <div v-show="currentTab === 'whatsapp'" class="space-y-6 animate-fadeIn">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">WhatsApp</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Notificações automáticas de status do pedido para o cliente</p>
            </div>
            <button
              @click="recarregarStatus"
              :disabled="waLoading"
              class="text-sm px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {{ waLoading ? 'Verificando...' : 'Atualizar status' }}
            </button>
          </div>

          <!-- Status -->
          <div class="flex items-center gap-3 p-4 rounded-xl border"
            :class="waStatus === 'open' ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10' : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30'"
          >
            <div class="w-3 h-3 rounded-full shrink-0"
              :class="waStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'"
            />
            <div>
              <p class="font-semibold text-sm"
                :class="waStatus === 'open' ? 'text-green-700 dark:text-green-400' : 'text-neutral-700 dark:text-neutral-300'"
              >
                {{ waStatus === 'open' ? 'Conectado' : 'Desconectado' }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ waStatus === 'open' ? 'Envio de mensagens ativo' : 'Escaneie o QR Code para conectar' }}
              </p>
            </div>
          </div>

          <!-- QR Code -->
          <div v-if="waStatus !== 'open'" class="space-y-4">
            <div v-if="!waQrCode" class="flex gap-3">
              <button
                @click="criarInstancia"
                :disabled="waLoading"
                class="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
              >
                {{ waLoading ? 'Aguarde...' : 'Gerar QR Code' }}
              </button>
            </div>

            <div v-if="waQrCode" class="flex flex-col items-center gap-4 py-4">
              <p class="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong> e escaneie:
              </p>
              <div class="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm inline-block">
                <img :src="waQrCode" alt="QR Code WhatsApp" class="w-56 h-56" />
              </div>
              <button @click="buscarQRCode" class="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline">
                Atualizar QR Code
              </button>
            </div>
          </div>

          <!-- Mensagens editáveis (sempre visível) -->
          <div class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Mensagens automáticas</h3>
              <button
                @click="salvarMensagens"
                :disabled="waSavingMessages"
                class="text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition-colors"
              >
                {{ waSavingMessages ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
            <div v-for="msg in waMessageFields" :key="msg.key" class="space-y-1">
              <label class="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <span>{{ msg.emoji }}</span> {{ msg.label }}
              </label>
              <textarea
                v-model="waMessages[msg.key]"
                rows="2"
                class="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { useToastStore } from "@/stores/toast";
import { SettingService, WhatsAppService } from "@/services/http";
import { onMounted } from "vue";
import { mascararTelefone, limparTelefone } from "@/utils/formatters";

// Estado
const toast = useToastStore();
const currentTab = ref("profile");
const isSaving = ref(false);

// WhatsApp
const waStatus = ref('disconnected')
const waQrCode = ref(null)
const waLoading = ref(false)

const recarregarStatus = async () => {
  waLoading.value = true
  try {
    const { data } = await WhatsAppService.getStatus()
    waStatus.value = data.status
  } catch {
    waStatus.value = 'disconnected'
  } finally {
    waLoading.value = false
  }
}

const buscarQRCode = async () => {
  try {
    const { data } = await WhatsAppService.getQRCode()
    waQrCode.value = data.base64 || data.qrcode || data.code || null
  } catch {
    toast.error('Erro ao buscar QR Code')
  }
}

const criarInstancia = async () => {
  waLoading.value = true
  try {
    await WhatsAppService.createInstance()
    await buscarQRCode()
  } catch {
    // instância já existe, tenta pegar o QR Code direto
    await buscarQRCode()
  } finally {
    waLoading.value = false
  }
}

const waMessages = reactive({
  em_preparo: '🍧 Seu pedido está sendo preparado! Em breve ficará pronto.',
  pronto: '✅ Seu pedido está pronto! Pode retirar ou aguardar a entrega.',
  finalizado: '🎉 Pedido finalizado. Obrigado pela preferência! Volte sempre 😊',
  cancelado: '❌ Seu pedido foi cancelado. Entre em contato se tiver dúvidas.',
})

const waSavingMessages = ref(false)

const waMessageFields = [
  { key: 'em_preparo', emoji: '🍧', label: 'Em preparo' },
  { key: 'pronto',     emoji: '✅', label: 'Pronto' },
  { key: 'finalizado', emoji: '🎉', label: 'Finalizado' },
  { key: 'cancelado',  emoji: '❌', label: 'Cancelado' },
]

const carregarMensagens = async () => {
  try {
    const { data } = await WhatsAppService.getMessages()
    Object.assign(waMessages, data)
  } catch { /* silencia erro de carregamento de mensagens */ }
}

const salvarMensagens = async () => {
  waSavingMessages.value = true
  try {
    await WhatsAppService.updateMessages({ ...waMessages })
    toast.success('Mensagens salvas!')
  } catch {
    toast.error('Erro ao salvar mensagens')
  } finally {
    waSavingMessages.value = false
  }
}

watch(currentTab, (tab) => {
  if (tab === 'whatsapp') {
    recarregarStatus()
    carregarMensagens()
  }
})

// Abas de Configuração
const tabs = [
  {
    id: "profile",
    label: "Perfil da Loja",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  },
  {
    id: "hours",
    label: "Horários",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  },
  {
    id: "delivery",
    label: "Taxas e Entrega",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
  },
  {
    id: "payment",
    label: "Pagamentos",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
  },
  {
    id: "print",
    label: "Impressão",
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  },
];

// Dados do Formulário (Simulando um fetch inicial)
const form = reactive({
  profile: {
    name: "Qbombom Sorvetes",
    cnpj: "12.345.678/0001-90",
    phone: "(11) 99999-9999",
    email: "contato@qbombom.com.br",
    address: {
      zip: "01234-567",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo - SP",
    },
  },
  hours: {
    isOpen: true,
    schedule: [
      { id: "mon", name: "Segunda", active: false, open: "18:00", close: "23:00" },
      { id: "tue", name: "Terça", active: true, open: "18:00", close: "23:30" },
      { id: "wed", name: "Quarta", active: true, open: "18:00", close: "23:30" },
      { id: "thu", name: "Quinta", active: true, open: "18:00", close: "23:30" },
      { id: "fri", name: "Sexta", active: true, open: "18:00", close: "00:30" },
      { id: "sat", name: "Sábado", active: true, open: "18:00", close: "00:30" },
      { id: "sun", name: "Domingo", active: true, open: "18:00", close: "23:30" },
    ],
  },
  delivery: {
    allowPickup: true,
    feeType: "fixed",
    fixedFee: 6.5,
    estimatedTimeMin: 30,
    estimatedTimeMax: 45,
  },
  payments: {
    pix: {
      name: "PIX",
      desc: "Pagamento instantâneo",
      active: true,
      icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Pix</title><path fill="currentColor" d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"/></svg>',
    },
    credit: {
      name: "Cartão de Crédito",
      desc: "Visa, Mastercard, Elo",
      active: true,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
    },
    debit: {
      name: "Cartão de Débito",
      desc: "Visa Electron, Maestro",
      active: true,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
    },
    cash: {
      name: "Dinheiro",
      desc: "Pagamento na entrega",
      active: true,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"/></svg>',
    },
  },
  pix: {
    type: "cnpj",
    key: "12.345.678/0001-90",
  },
  print: {
    autoPrint: true,
    deliverySlip: true,
    paperSize: "80mm",
  },
});

// Buscar config ao montar a tela
const carregarConfiguracoes = async () => {
  try {
    const res = await SettingService.getSettings();
    if (res.data && Object.keys(res.data).length > 0) {
      // Mescla os dados do banco no form mantendo as propriedades reativas
      Object.assign(form, res.data);
      if (form.profile?.phone) form.profile.phone = mascararTelefone(form.profile.phone);
    }
  } catch (error) {
    console.error("Erro ao carregar configurações do banco:", error);
  }
};

onMounted(() => {
  carregarConfiguracoes();
});

const salvarConfiguracoes = async () => {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    if (!form.profile.name) {
      throw new Error("O nome da loja é obrigatório.");
    }

    const payload = JSON.parse(JSON.stringify(form));
    if (payload.profile?.phone) payload.profile.phone = limparTelefone(payload.profile.phone);
    await SettingService.saveSettings(payload);
    toast.success("Configurações salvas com sucesso!");
  } catch (error) {
    if (error instanceof Error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.error("Ocorreu um erro inesperado ao salvar.");
    }
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
