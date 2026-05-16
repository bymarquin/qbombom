import { ref, computed, watch } from 'vue'
import { useToastStore } from '@/stores/toast'

export function useProductBuilder(produtoRef) {
  const toast = useToastStore()

  const tamanhoSelecionado = ref(null)
  const adicionaisSelecionados = ref([])
  const observacaoProduto = ref('')
  const itemQuantidades = ref({})
  const saborQuantidades = ref({})
  const pesoGramas = ref(null)
  const quantidade = ref(1)

  function resetState() {
    tamanhoSelecionado.value = null
    adicionaisSelecionados.value = []
    observacaoProduto.value = ''
    itemQuantidades.value = {}
    saborQuantidades.value = {}
    pesoGramas.value = null
    quantidade.value = 1
  }

  const isWeightBased = computed(() => produtoRef.value?.weightBased ?? false)

  const grupoSabor = computed(() =>
    (produtoRef.value?.additionalGroups ?? []).find(g => !!g.isSaborGroup) ?? null
  )

  const isSorvete = computed(() => !isWeightBased.value && !!grupoSabor.value)

  const bolaCount = computed(() =>
    Object.values(saborQuantidades.value).reduce((acc, v) => acc + Number(v || 0), 0)
  )

  const bolaPrice = computed(() =>
    bolaCount.value <= 0 ? 0 : (bolaCount.value === 1 ? 4.00 : bolaCount.value * 3.50)
  )

  const grupoById = computed(() =>
    new Map((produtoRef.value?.additionalGroups ?? []).map(g => [g.id, g]))
  )

  const limiteGlobal = computed(() => tamanhoSelecionado.value?.maxAdditionals ?? null)

  const totalSelecionado = computed(() => {
    const gruposQueContam = new Set(
      (produtoRef.value?.additionalGroups ?? [])
        .filter(g => !g.stepperMode && g.countsTowardLimit !== false)
        .map(g => g.id)
    )
    return adicionaisSelecionados.value.filter(a => gruposQueContam.has(a.grupoId)).length
  })

  const atingiuLimite = computed(() =>
    limiteGlobal.value !== null && totalSelecionado.value >= limiteGlobal.value
  )

  const stepperTotal = computed(() => {
    const grupos = (produtoRef.value?.additionalGroups ?? []).filter(g => g.stepperMode)
    if (!grupos.length) return 0
    return grupos.reduce((accGrupo, grupo) =>
      accGrupo + grupo.items.reduce((accItem, item) =>
        accItem + Number(item.price) * (itemQuantidades.value[item.id] || 0), 0), 0)
  })

  const calcularPeso = (preco, pricePerKg) => {
    const gramas = (preco / pricePerKg) * 1000
    return gramas >= 1000
      ? `${(gramas / 1000).toFixed(2).replace('.', ',')} kg`
      : `${Math.round(gramas)} g`
  }

  const isSaborGroup = (grupo) => !!grupo.isSaborGroup
  const minEfetivoGrupo = (grupo) => grupo.minChoices
  const maxEfetivoGrupo = (grupo) => grupo.maxChoices

  const atingiuMaximoSabores = (grupo) => {
    const max = Number(grupo?.maxChoices)
    if (!Number.isFinite(max) || max <= 0) return false
    return bolaCount.value >= max
  }

  const atingiuMaximo = (grupo) =>
    qtdSelecionadaNoGrupo(grupo.id) >= maxEfetivoGrupo(grupo)

  const incrementarSabor = (itemId, grupo) => {
    if (atingiuMaximoSabores(grupo)) return
    saborQuantidades.value = { ...saborQuantidades.value, [itemId]: (saborQuantidades.value[itemId] || 0) + 1 }
  }

  const decrementarSabor = (itemId) => {
    const atual = saborQuantidades.value[itemId] || 0
    if (atual <= 0) return
    saborQuantidades.value = { ...saborQuantidades.value, [itemId]: atual - 1 }
  }

  const incrementarItem = (itemId) => {
    itemQuantidades.value = { ...itemQuantidades.value, [itemId]: (itemQuantidades.value[itemId] || 0) + 1 }
  }

  const decrementarItem = (itemId) => {
    const atual = itemQuantidades.value[itemId] || 0
    if (atual > 0) itemQuantidades.value = { ...itemQuantidades.value, [itemId]: atual - 1 }
  }

  const itensSelecionadosNoGrupo = (grupoId) =>
    adicionaisSelecionados.value.filter(a => a.grupoId === grupoId)

  const qtdSelecionadaNoGrupo = (grupoId) => {
    if (grupoSabor.value?.id === grupoId) return bolaCount.value
    const grupo = grupoById.value.get(grupoId)
    if (grupo?.stepperMode) {
      return (grupo.items ?? []).reduce((acc, item) => acc + Number(itemQuantidades.value[item.id] || 0), 0)
    }
    return itensSelecionadosNoGrupo(grupoId).length
  }

  const isAdicionalSelecionado = (adicional) =>
    adicionaisSelecionados.value.some(a => a.id === adicional.id)

  const estaBloqueado = (adicional, grupo) => {
    if (isAdicionalSelecionado(adicional)) return false
    if (atingiuMaximo(grupo)) return true
    return grupo.countsTowardLimit !== false && atingiuLimite.value
  }

  const selecionarUnico = (add, grupo) => {
    adicionaisSelecionados.value = adicionaisSelecionados.value.filter(a => a.grupoId !== grupo.id)
    adicionaisSelecionados.value.push({ ...add, grupoId: grupo.id })
  }

  const adicionaisComPreco = computed(() => {
    if (!produtoRef.value?.additionalGroups) return []
    const selecionados = produtoRef.value.additionalGroups
      .filter(grupo => !grupo.stepperMode && !isSaborGroup(grupo))
      .flatMap((grupo) => {
        const itens = [...itensSelecionadosNoGrupo(grupo.id)].sort((a, b) => Number(a.price) - Number(b.price))
        return itens.map((item, index) => ({
          id: item.id,
          name: item.name,
          price: index < grupo.freeChoices ? 0 : Number(item.price),
          grupoName: grupo.name,
        }))
      })

    const sabores = grupoSabor.value
      ? grupoSabor.value.items
          .filter(item => (saborQuantidades.value[item.id] || 0) > 0)
          .map(item => ({
            id: item.id,
            name: `${item.name} x${saborQuantidades.value[item.id]}`,
            price: 0,
            grupoName: grupoSabor.value.name,
          }))
      : []

    return [...selecionados, ...sabores]
  })

  const stepperSelecionadosComPreco = computed(() => {
    if (!produtoRef.value?.additionalGroups) return []
    return produtoRef.value.additionalGroups
      .filter(grupo => grupo.stepperMode)
      .flatMap((grupo) =>
        (grupo.items ?? [])
          .filter(item => (itemQuantidades.value[item.id] || 0) > 0)
          .map((item) => {
            const qty = itemQuantidades.value[item.id] || 0
            return {
              id: item.id,
              name: `${item.name} x${qty}`,
              price: Number(item.price) * qty,
              grupoName: grupo.name,
            }
          })
      )
  })

  const totalItemAtual = computed(() => {
    if (!produtoRef.value) return 0
    const extras = stepperTotal.value + adicionaisComPreco.value.reduce((acc, item) => acc + item.price, 0)
    if (isWeightBased.value) return (pesoGramas.value || 0) + extras
    const base = isSorvete.value
      ? bolaPrice.value
      : (tamanhoSelecionado.value ? Number(tamanhoSelecionado.value.price) : 0)
    return base + extras
  })

  const podeConfirmar = computed(() => {
    if (!produtoRef.value) return false
    if (isSorvete.value && !grupoSabor.value) return false
    if (isSorvete.value && grupoSabor.value && bolaCount.value < Number(grupoSabor.value.minChoices || 0)) return false
    if (isWeightBased.value) {
      const min = Number(produtoRef.value.minPrice) || 0
      return pesoGramas.value > 0 && pesoGramas.value >= min
    }
    if (!isSorvete.value && produtoRef.value.variations?.length > 0 && !tamanhoSelecionado.value) return false
    return (produtoRef.value.additionalGroups ?? []).every(
      grupo => isSaborGroup(grupo) || grupo.stepperMode || grupo.minChoices === 0 || qtdSelecionadaNoGrupo(grupo.id) >= minEfetivoGrupo(grupo)
    )
  })

  function montarPayload() {
    return {
      productId: produtoRef.value.id,
      productName: produtoRef.value.name,
      allowedOrderTypes: produtoRef.value.allowedOrderTypes ?? ['Mesa', 'Viagem', 'Entrega'],
      variationId: (isSorvete.value || isWeightBased.value) ? null : (tamanhoSelecionado.value?.id ?? null),
      variationName: isWeightBased.value
        ? `${pesoGramas.value}g`
        : isSorvete.value
          ? `${bolaCount.value} ${bolaCount.value === 1 ? 'Bola' : 'Bolas'}`
          : (tamanhoSelecionado.value?.name ?? ''),
      quantity: quantidade.value,
      selectedAdditionals: [...adicionaisComPreco.value, ...stepperSelecionadosComPreco.value],
      observation: observacaoProduto.value,
      totalPrice: totalItemAtual.value,
    }
  }

  watch(tamanhoSelecionado, () => {
    const max = limiteGlobal.value
    if (max === null) return
    const contam = adicionaisSelecionados.value.filter(a => grupoById.value.get(a.grupoId)?.countsTowardLimit !== false)
    if (contam.length > max) {
      const naoContam = adicionaisSelecionados.value.filter(a => grupoById.value.get(a.grupoId)?.countsTowardLimit === false)
      adicionaisSelecionados.value = [...contam.slice(0, max), ...naoContam]
    }
  })

  watch(totalSelecionado, (novo, anterior) => {
    if (limiteGlobal.value !== null && novo === limiteGlobal.value && novo > anterior) {
      toast.info('Máximo de complementos atingido!')
    }
  })

  return {
    tamanhoSelecionado,
    adicionaisSelecionados,
    observacaoProduto,
    itemQuantidades,
    saborQuantidades,
    pesoGramas,
    quantidade,
    isWeightBased,
    grupoSabor,
    isSorvete,
    bolaCount,
    bolaPrice,
    grupoById,
    limiteGlobal,
    totalSelecionado,
    atingiuLimite,
    stepperTotal,
    adicionaisComPreco,
    stepperSelecionadosComPreco,
    totalItemAtual,
    podeConfirmar,
    resetState,
    calcularPeso,
    isSaborGroup,
    minEfetivoGrupo,
    maxEfetivoGrupo,
    atingiuMaximoSabores,
    atingiuMaximo,
    incrementarSabor,
    decrementarSabor,
    incrementarItem,
    decrementarItem,
    itensSelecionadosNoGrupo,
    qtdSelecionadaNoGrupo,
    isAdicionalSelecionado,
    estaBloqueado,
    selecionarUnico,
    montarPayload,
  }
}
