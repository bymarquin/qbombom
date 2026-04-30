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
        <LoaderCircle v-if="isSaving" class="animate-spin h-5 w-5 text-white" />
        <Save v-else class="w-5 h-5" />
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
          <component :is="tab.icon" class="w-5 h-5 flex-shrink-0" />
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
                      class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer"
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
                  <component :is="paymentIcons[key]" class="w-5 h-5" />
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
                  class="w-full h-[42px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer"
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

          <div class="mt-8 space-y-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-neutral-900 dark:text-neutral-100">Taxa de serviço</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Acréscimo aplicado no checkout para pedidos PIX do cardápio público.
                </p>
              </div>
              <button
                @click="form.serviceCharge.enabled = !form.serviceCharge.enabled"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                :class="form.serviceCharge.enabled ? 'bg-red-600' : 'bg-neutral-300 dark:bg-neutral-700'"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="form.serviceCharge.enabled ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <div v-if="form.serviceCharge.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo</label>
                <select
                  v-model="form.serviceCharge.type"
                  class="w-full h-[42px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer"
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {{ form.serviceCharge.type === 'percent' ? 'Percentual (%)' : 'Valor (R$)' }}
                </label>
                <input
                  v-model.number="form.serviceCharge.value"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  :placeholder="form.serviceCharge.type === 'percent' ? 'Ex: 1.00' : 'Ex: 0.50'"
                />
              </div>
            </div>
          </div>

        </div>

        <!-- Tab: Manutenção -->
        <div v-show="currentTab === 'maintenance'" class="space-y-8 animate-fadeIn">
          <div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Modo Manutenção
            </h2>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6">
              Bloqueia novos pedidos no cardápio público e exibe uma mensagem para os clientes.
            </p>

            <div class="space-y-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h3 class="font-bold text-neutral-900 dark:text-neutral-100">Ativar manutenção</h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Quando ativo, o checkout do cardápio fica indisponível.
                  </p>
                </div>
                <button
                  @click="form.maintenance.enabled = !form.maintenance.enabled"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  :class="form.maintenance.enabled ? 'bg-red-600' : 'bg-neutral-300 dark:bg-neutral-700'"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="form.maintenance.enabled ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>

              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Mensagem da tela</label>
                <textarea
                  v-model="form.maintenance.message"
                  rows="2"
                  class="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="Estamos em manutenção e voltamos em breve."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: WhatsApp -->
        <div v-show="currentTab === 'whatsapp'" class="space-y-6 animate-fadeIn">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">WhatsApp</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Notificações automáticas de status do pedido para o cliente
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="reconectarWhatsapp"
                v-if="waStatus !== 'open'"
                :disabled="waLoadingAction"
                class="text-sm px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
              >
                {{ waLoadingAction ? "Conectando..." : "Reconectar" }}
              </button>
              <button
                @click="desconectarWhatsapp"
                v-else
                :disabled="waLoadingAction"
                class="text-sm px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
              >
                {{ waLoadingAction ? "Desconectando..." : "Desconectar" }}
              </button>
              <button
                @click="recarregarStatus"
                :disabled="waLoading"
                class="text-sm px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {{ waLoading ? "Verificando..." : "Atualizar status" }}
              </button>
            </div>
          </div>

          <!-- Status -->
          <div
            class="flex items-center gap-3 p-4 rounded-xl border"
            :class="waStatusMeta.containerClass"
          >
            <div
              class="w-3 h-3 rounded-full shrink-0"
              :class="waStatusMeta.dotClass"
            />
            <div>
              <p class="font-semibold text-sm" :class="waStatusMeta.labelClass">
                {{ waStatusMeta.label }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ waStatusMeta.description }}
              </p>
              <p v-if="waRawStatus" class="text-[11px] text-neutral-400 mt-1">
                Status técnico: {{ waRawStatus }}
              </p>
              <p v-if="waLastError" class="text-[11px] text-red-500 mt-1">
                Erro: {{ waLastError }}
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
                {{ waLoading ? "Aguarde..." : "Gerar QR Code" }}
              </button>
            </div>

            <div v-if="waQrCode" class="flex flex-col items-center gap-4 py-4">
              <p class="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> →
                <strong>Conectar dispositivo</strong> e escaneie:
              </p>
              <div
                class="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm inline-block"
              >
                <qrcode-vue
                  v-if="waQrCodeString"
                  :value="waQrCodeString"
                  :size="224"
                  level="M"
                  render-as="svg"
                />
                <img v-else-if="waQrCode" :src="waQrCode" alt="QR Code WhatsApp" class="w-56 h-56" />
              </div>
              <button
                @click="buscarQRCode"
                class="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
              >
                Atualizar QR Code
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, onUnmounted } from "vue";
import QrcodeVue from "qrcode.vue";
import { useToastStore } from "@/stores/toast";
import { SettingService, WhatsAppService } from "@/services/http";
import { mascararTelefone, limparTelefone } from "@/utils/formatters";
import {
  Save,
  LoaderCircle,
  Store,
  Clock3,
  Truck,
  CreditCard,
  Wrench,
  MessageCircle,
  Landmark,
  Banknote,
} from "lucide-vue-next";

// Estado
const toast = useToastStore();
const currentTab = ref("profile");
const isSaving = ref(false);

// WhatsApp
const waStatus = ref("disconnected");
const waQrCode = ref(null);
const waQrCodeString = ref("");
const waLoading = ref(false);
const waLoadingAction = ref(false);
const waRawStatus = ref(null);
const waLastError = ref("");
const waPollingInFlight = ref(false);
let waPollTimer = null;
let waPollMs = 0;

const waStatusMeta = computed(() => {
  if (waStatus.value === "open") {
    return {
      label: "Conectado",
      description: "Envio de mensagens ativo",
      containerClass: "border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10",
      dotClass: "bg-green-500 animate-pulse",
      labelClass: "text-green-700 dark:text-green-400",
    };
  }

  if (waStatus.value === "connecting") {
    return {
      label: "Conectando",
      description: "Aguardando pareamento/QR Code",
      containerClass: "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10",
      dotClass: "bg-amber-500 animate-pulse",
      labelClass: "text-amber-700 dark:text-amber-400",
    };
  }

  if (waStatus.value === "error") {
    return {
      label: "Com erro",
      description: "Falha ao consultar instância. Tente reconectar.",
      containerClass: "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10",
      dotClass: "bg-red-500",
      labelClass: "text-red-700 dark:text-red-400",
    };
  }

  return {
    label: "Desconectado",
    description: "Escaneie o QR Code para conectar",
    containerClass: "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30",
    dotClass: "bg-neutral-400",
    labelClass: "text-neutral-700 dark:text-neutral-300",
  };
});

const applyWaStatus = (data = {}) => {
  waStatus.value = data.status || "disconnected";
  waRawStatus.value = data.rawStatus || null;
  waLastError.value = data?.lastError || "";

  if (waStatus.value === "open") {
    waQrCode.value = null;
    waQrCodeString.value = "";
  }
  };

const getWaPollInterval = () => {
  if (waStatus.value === "connecting") return 5000;
  if (waStatus.value !== "open" && waQrCode.value) return 5000;
  return 15000;
};

const stopWaPolling = () => {
  if (waPollTimer) {
    clearInterval(waPollTimer);
    waPollTimer = null;
  }
};

const pollWaStatus = async () => {
  if (waPollingInFlight.value || waLoading.value || waLoadingAction.value) return;
  waPollingInFlight.value = true;
  try {
    await recarregarStatus();
    if (waStatus.value !== "open" && !waQrCode.value) {
      await buscarQRCode();
    }
  } finally {
    waPollingInFlight.value = false;
  }
};

const restartWaPolling = () => {
  if (currentTab.value !== "whatsapp") {
    stopWaPolling();
    return;
  }

  const nextInterval = getWaPollInterval();
  if (waPollTimer && waPollMs === nextInterval) return;

  stopWaPolling();
  waPollMs = nextInterval;
  waPollTimer = setInterval(() => {
    pollWaStatus();
  }, waPollMs);
};

const recarregarStatus = async () => {
  waLoading.value = true;
  try {
    const { data } = await WhatsAppService.getStatus();
    applyWaStatus(data);
  } catch {
    applyWaStatus({ status: "error", lastError: "Falha ao consultar status." });
  } finally {
    waLoading.value = false;
  }
};

const buscarQRCode = async () => {
  try {
    const { data } = await WhatsAppService.getQRCode();
    // Prioriza o código bruto para renderizar com qrcode-vue (padrão P&B)
    waQrCodeString.value = data.code || data.qrcode || "";
    // Fallback para a imagem se não houver código
    waQrCode.value = data.base64 || null;
  } catch {
    toast.error("Erro ao buscar QR Code");
  }
};

const criarInstancia = async () => {
  waLoading.value = true;
  try {
    await WhatsAppService.createInstance();
    await recarregarStatus();
    await buscarQRCode();
  } catch {
    // instância já existe, tenta pegar o QR Code direto
    await buscarQRCode();
  } finally {
    waLoading.value = false;
  }
};

const desconectarWhatsapp = async () => {
  waLoadingAction.value = true;
  try {
    await WhatsAppService.disconnect();
    waQrCode.value = null;
    waQrCodeString.value = "";
    await recarregarStatus();
    toast.success("WhatsApp desconectado com sucesso.");
  } catch {
    toast.error("Erro ao desconectar WhatsApp");
  } finally {
    waLoadingAction.value = false;
  }
};

const reconectarWhatsapp = async () => {
  waLoadingAction.value = true;
  try {
    await WhatsAppService.reconnect();
    await recarregarStatus();
    if (waStatus.value !== "open") {
      await buscarQRCode();
    }
    toast.success("Reconexão iniciada.");
  } catch {
    toast.error("Erro ao reconectar WhatsApp");
  } finally {
    waLoadingAction.value = false;
  }
};


watch(currentTab, (tab) => {
  if (tab === "whatsapp") {
    recarregarStatus().then(() => {
      if (waStatus.value !== "open") return buscarQRCode();
      return null;
    });
    restartWaPolling();
  } else {
    stopWaPolling();
  }
});

watch([waStatus, waQrCode, currentTab], () => {
  restartWaPolling();
});

// Abas de Configuração
const tabs = [
  {
    id: "profile",
    label: "Perfil da Loja",
    icon: Store,
  },
  {
    id: "hours",
    label: "Horários",
    icon: Clock3,
  },
  {
    id: "delivery",
    label: "Taxas e Entrega",
    icon: Truck,
  },
  {
    id: "payment",
    label: "Pagamentos",
    icon: CreditCard,
  },
  {
    id: "maintenance",
    label: "Manutenção",
    icon: Wrench,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
  },
];

const paymentIcons = {
  pix: Landmark,
  credit: CreditCard,
  debit: CreditCard,
  cash: Banknote,
};

const normalizePixType = (value) => {
  const val = String(value || "").toLowerCase();
  if (["cpf", "cnpj", "email", "phone", "random"].includes(val)) return val;
  if (["celular", "telefone"].includes(val)) return "phone";
  if (["aleatoria", "aleatória", "evp"].includes(val)) return "random";
  return "cpf";
};

// Dados do Formulário (Simulando um fetch inicial)
const form = reactive({
  profile: {
    name: "Qbombom Sorvetes",
    cnpj: "",
    phone: "(88) 99290-0865",
    email: "",
    address: {
      zip: "63170-000",
      street: "",
      number: "",
      neighborhood: "Centro",
      city: "Araripe - CE",
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
    },
    credit: {
      name: "Cartão de Crédito",
      desc: "Visa, Mastercard, Elo",
      active: true,
    },
    debit: {
      name: "Cartão de Débito",
      desc: "Visa Electron, Maestro",
      active: true,
    },
    cash: {
      name: "Dinheiro",
      desc: "Pagamento na entrega",
      active: true,
    },
  },
  pix: {
    type: "phone",
    key: "88992998161",
  },
  maintenance: {
    enabled: false,
    message: "Estamos em manutenção e voltamos em breve.",
  },
  serviceCharge: {
    enabled: false,
    type: "percent",
    value: 0,
  },
});

// Buscar config ao montar a tela
const carregarConfiguracoes = async () => {
  try {
    const res = await SettingService.getSettings();
    if (res.data && Object.keys(res.data).length > 0) {
      // Mescla os dados do banco no form mantendo as propriedades reativas
      Object.assign(form, res.data);
      if (!form.maintenance) {
        form.maintenance = { enabled: false, message: "Estamos em manutenção e voltamos em breve." };
      }
      if (!form.serviceCharge) {
        form.serviceCharge = { enabled: false, type: "percent", value: 0 };
      }
      if (form.profile?.phone) form.profile.phone = mascararTelefone(form.profile.phone);
      if (form.pix) form.pix.type = normalizePixType(form.pix.type);
    }
  } catch (error) {
    console.error("Erro ao carregar configurações do banco:", error);
  }
};

onMounted(() => {
  carregarConfiguracoes();
});

onUnmounted(() => {
  stopWaPolling();
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
    if (payload.pix) payload.pix.type = normalizePixType(payload.pix.type);
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
