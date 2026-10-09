<script setup lang="ts">
// LA COLUMNA DE 700 KM, como la columna estratigráfica de una carta geológica: los tres tramos de
// profundidad apilados con su trama, las cotas a la derecha y una flecha donde empezó el sismo. En
// la ficha va grande y con la cifra; en la lista, en miniatura.

const props = defineProps<{ km: number; compacto?: boolean }>()
const FONDO = 700
const en = computed(() => Math.min(100, (Math.max(0, props.km) / FONDO) * 100))
const NOMBRES = { superficial: 'superficial', intermedio: 'intermedio', profundo: 'profundo' } as const
const COTAS = [0, FRONTERAS.intermedio, FRONTERAS.profundo, FONDO]
</script>

<template>
  <div
    class="hondura"
    :class="{ compacto }"
    :style="{ '--en': `${en}%`, '--tono': colorProfundidad(km), '--t1': FRONTERAS.intermedio, '--t2': FRONTERAS.profundo - FRONTERAS.intermedio, '--t3': FONDO - FRONTERAS.profundo }"
    role="img"
    :aria-label="`${kilometros(km)} de profundidad, ${NOMBRES[tipoProfundidad(km)]}`"
  >
    <span class="hondura-pozo">
      <i class="t1" />
      <i class="t2" />
      <i class="t3" />
    </span>
    <span class="hondura-marca">
      <b v-if="!compacto">{{ kilometros(km) }}</b>
    </span>
    <template v-if="!compacto">
      <small v-for="c in COTAS" :key="c" class="hondura-cota" :style="{ '--en': `${(c / FONDO) * 100}%` }">{{ c === FONDO ? `${c} km` : c }}</small>
    </template>
  </div>
</template>
