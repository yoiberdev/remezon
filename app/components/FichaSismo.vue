<script setup lang="ts">
import type { Sismo } from '~/composables/useSismos'

// La ficha del sismo elegido (o del último, si no se eligió ninguno).

const props = defineProps<{ sismo: Sismo; esUltimo: boolean }>()
const ahora = useAhora()
const NOMBRES = { superficial: 'superficial', intermedio: 'intermedio', profundo: 'profundo' } as const
const tipo = computed(() => NOMBRES[tipoProfundidad(props.sismo.prof)])
// El IGP la da como «II-III Santa María de Nieva»: el grado y dónde se midió.
const intensidad = computed(() => {
  const m = props.sismo.intensidad?.match(/^([IVX]+(?:\s*-\s*[IVX]+)?)\s+(.+)$/)
  return m ? { grado: m[1]!.replace(/\s/g, ''), donde: m[2] } : null
})
const deIGP = computed(() => props.sismo.url.includes('igp.gob.pe'))
const lugar = computed(() => partirLugar(props.sismo.lugar))
</script>

<template>
  <article class="ficha" :style="{ '--tono': colorProfundidad(sismo.prof) }">
    <p class="rotulo">
      <span>{{ esUltimo ? 'El último' : 'El que elegiste' }}</span>
      <span>{{ hace(sismo.t, ahora) }}</span>
    </p>
    <div class="ficha-cuerpo">
      <div class="ficha-texto">
        <p class="ficha-mag"><small>M</small>{{ magnitud(sismo.mag) }}</p>
        <h2>{{ lugar.lugar }}</h2>
        <p v-if="lugar.region" class="ficha-region">{{ lugar.region }}</p>
        <p class="ficha-dato">{{ fechaLima(sismo.t) }}, hora de Lima</p>
        <p class="ficha-dato">
          <b>{{ kilometros(sismo.prof) }}</b> bajo tierra, {{ tipo }}
        </p>
        <p v-if="intensidad" class="ficha-dato">
          Intensidad <b>{{ intensidad.grado }}</b> en {{ intensidad.donde }}
        </p>
        <p v-else-if="sismo.intensidad" class="ficha-dato">Intensidad: {{ sismo.intensidad }}</p>
        <p v-if="sismo.sentido" class="ficha-dato">
          {{ sismo.sentido }} {{ sismo.sentido === 1 ? 'persona dijo' : 'personas dijeron' }} en el USGS que lo sintieron
        </p>
      </div>
      <Hondura :km="sismo.prof" />
    </div>
    <p v-if="sismo.tsunami" class="ficha-aviso">
      Fue grande y en el mar. Los avisos de tsunami en el Perú los da la
      <a href="https://www.dhn.mil.pe" target="_blank" rel="noopener">Marina de Guerra (DHN)</a>.
    </p>
    <a class="ficha-enlace" :href="sismo.url" target="_blank" rel="noopener">{{ deIGP ? 'Reporte del IGP' : 'Ficha en el USGS' }} ↗</a>
  </article>
</template>
