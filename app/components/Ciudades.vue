<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import { proyectar, sobreTierra } from '#shared/zona'

// LOS RÓTULOS DE LA CARTA: unas cuantas ciudades para orientarse, apoyadas sobre el relieve, y los
// nombres que lleva cualquier mapa del Perú: el océano en cursiva y espaciado, los países vecinos en
// versalitas grises.
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
const PAISES: [string, number, number][] = [
  ['Ecuador', -2.2, -78.6],
  ['Colombia', -0.6, -73.4],
  ['Brasil', -8.4, -69.4],
  ['Bolivia', -15.6, -68.2],
  ['Chile', -18.6, -69.6],
]

const puestas = ref<{ nombre: string; pos: [number, number, number] }[]>([])
const paises = ref<{ nombre: string; pos: [number, number, number] }[]>([])
onMounted(async () => {
  const r = await cargarRelieve()
  const sobre = (lat: number, lon: number, alto = 0.06): [number, number, number] => {
    const { x, z } = proyectar(lon, lat)
    return [x, sobreTierra(Math.max(0, r.en(lon, lat))) + alto, z]
  }
  puestas.value = CIUDADES.map(([nombre, lat, lon]) => ({ nombre, pos: sobre(lat, lon) }))
  paises.value = PAISES.map(([nombre, lat, lon]) => ({ nombre, pos: sobre(lat, lon, 0.25) }))
})
const mar = (() => {
  const { x, z } = proyectar(-80.6, -11.2)
  return [x, 0.05, z] as [number, number, number]
})()
</script>

<template>
  <Html v-for="c in puestas" :key="c.nombre" :position="c.pos" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="ciudad"><i></i>{{ c.nombre }}</span>
  </Html>
  <Html v-for="p in paises" :key="p.nombre" :position="p.pos" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="pais">{{ p.nombre }}</span>
  </Html>
  <Html :position="mar" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="oceano">Océano Pacífico</span>
  </Html>
</template>
