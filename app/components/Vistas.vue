<script setup lang="ts">
// Los cuatro puntos de vista de la cámara (Escena.vue). Tocar el mismo otra vez lo vuelve a encuadrar.

const vista = useState<string>('vista', () => 'tres')
const vuelta = useState('vistaVuelta', () => 0)
const VISTAS = [
  ['tres', '3D', 'De costado: el relieve y la placa a la vez'],
  ['mapa', 'Mapa', 'Desde arriba'],
  ['corte', 'Corte', 'Desde el sur: la placa de Nazca dibujada por los sismos'],
  ['abajo', 'Desde abajo', 'A través del suelo'],
] as const

function ir(v: string) {
  if (vista.value === v) vuelta.value++
  else vista.value = v
}
</script>

<template>
  <nav class="vistas" aria-label="Vistas de la cámara">
    <button v-for="([v, t, d], i) in VISTAS" :key="v" :aria-pressed="vista === v" :title="`${d} (tecla ${i + 1})`" @click="ir(v)">
      <kbd>{{ i + 1 }}</kbd>{{ t }}
    </button>
  </nav>
</template>
