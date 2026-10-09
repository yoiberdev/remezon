<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import { proyectar, sobreTierra } from '#shared/zona'

// Unas cuantas ciudades para orientarse, apoyadas sobre el relieve.
const CIUDADES: [string, number, number][] = [
  ['Lima', -12.046, -77.043],
  ['Arequipa', -16.409, -71.537],
  ['Trujillo', -8.112, -79.029],
  ['Chiclayo', -6.771, -79.841],
  ['Piura', -5.194, -80.632],
  ['Iquitos', -3.749, -73.253],
  ['Cusco', -13.532, -71.968],
  ['Huancayo', -12.065, -75.205],
  ['Pucallpa', -8.379, -74.554],
  ['Tacna', -18.006, -70.246],
  ['Puno', -15.84, -70.022],
  ['Ica', -14.068, -75.729],
]

const puestas = ref<{ nombre: string; pos: [number, number, number] }[]>([])
onMounted(async () => {
  const r = await cargarRelieve()
  puestas.value = CIUDADES.map(([nombre, lat, lon]) => {
    const { x, z } = proyectar(lon, lat)
    return { nombre, pos: [x, sobreTierra(Math.max(0, r.en(lon, lat))) + 0.06, z] }
  })
})
</script>

<template>
  <Html v-for="c in puestas" :key="c.nombre" :position="c.pos" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="ciudad"><i></i>{{ c.nombre }}</span>
  </Html>
</template>
