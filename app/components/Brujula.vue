<script setup lang="ts">
// LA FLECHA DEL NORTE Y LA ESCALA GRÁFICA de la leyenda. La flecha gira con la cámara (Escena.vue
// mide hacia dónde queda el norte). La escala solo es cierta mirando desde arriba: en perspectiva
// cada cosa está a otra distancia, así que ahí se dice en vez de dibujarse.

const b = useState('brujula', () => ({ rumbo: 0, pxPor100km: 0, planta: true }))
const escala = computed(() => {
  const px100 = b.value.pxPor100km
  if (!px100) return null
  const km = [50, 100, 200, 250, 500].find((k) => (k / 100) * px100 >= 64) ?? 500
  return { km, px: (km / 100) * px100 }
})
</script>

<template>
  <div class="brujula">
    <svg class="norte" viewBox="0 0 32 48" :style="{ rotate: `${b.rumbo}deg` }" role="img" aria-label="Norte">
      <path d="M16 12 L23 40 L16 34 Z" class="norte-lleno" />
      <path d="M16 12 L9 40 L16 34 Z" class="norte-vacio" />
      <text x="16" y="9" text-anchor="middle">N</text>
    </svg>
    <div v-if="b.planta && escala" class="escala" :style="{ '--px': `${escala.px}px` }">
      <span class="escala-barra"><i /><i /><i /><i /></span>
      <span class="escala-cifras"><small>0</small><small>{{ escala.km / 2 }}</small><small>{{ escala.km }} km</small></span>
    </div>
    <p v-else class="escala-nota">En perspectiva la escala cambia de un punto a otro. En la vista Mapa aparece la escala gráfica.</p>
  </div>
</template>
