<script setup lang="ts">
// UN POZO DE 700 KM: la columna de la superficie al fondo de la caja, con los tres tramos de color y
// una marca donde empezó el sismo. En la ficha va grande y con la cifra; en la lista, en miniatura.

const props = defineProps<{ km: number; compacto?: boolean }>()
const FONDO = 700
const en = computed(() => Math.min(100, (Math.max(0, props.km) / FONDO) * 100))
const NOMBRES = { superficial: 'superficial', intermedio: 'intermedio', profundo: 'profundo' } as const
</script>

<template>
  <div
    class="hondura"
    :class="{ compacto }"
    :style="{ '--en': `${en}%`, '--tono': colorProfundidad(km) }"
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
    <small v-if="!compacto" class="hondura-fondo">700</small>
  </div>
</template>
