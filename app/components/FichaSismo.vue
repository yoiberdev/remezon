<script setup lang="ts">
import type { Sismo } from '~/composables/useSismos'

// La ficha del sismo elegido (o del último, si no se eligió ninguno), como la nota de una carta:
// la magnitud grande, el lugar y una tabla con lo demás, y al lado su columna de profundidad.

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
    <p class="ficha-cabeza">
      <span>{{ esUltimo ? 'Último sismo' : 'Sismo elegido' }}</span>
      <span>{{ hace(sismo.t, ahora) }}</span>
    </p>
    <div class="ficha-cuerpo">
      <div class="ficha-texto">
        <p class="ficha-mag"><b>{{ magnitud(sismo.mag) }}</b><small>magnitud</small></p>
        <h2>{{ lugar.lugar }}</h2>
        <p v-if="lugar.region" class="ficha-region">{{ lugar.region }}</p>
        <dl class="ficha-tabla">
          <dt>Hora de Lima</dt>
          <dd>{{ fechaLima(sismo.t) }}</dd>
          <dt>Profundidad</dt>
          <dd><b>{{ kilometros(sismo.prof) }}</b>, {{ tipo }}</dd>
          <template v-if="intensidad">
            <dt>Intensidad</dt>
            <dd><b>{{ intensidad.grado }}</b> en {{ intensidad.donde }}</dd>
          </template>
          <template v-else-if="sismo.intensidad">
            <dt>Intensidad</dt>
            <dd>{{ sismo.intensidad }}</dd>
          </template>
          <template v-if="sismo.sentido">
            <dt>Lo sintieron</dt>
            <dd>{{ sismo.sentido }} {{ sismo.sentido === 1 ? 'persona' : 'personas' }}, según el USGS</dd>
          </template>
        </dl>
      </div>
      <Hondura :km="sismo.prof" />
    </div>
    <p v-if="sismo.tsunami" class="ficha-aviso">
      Fue grande y en el mar. Los avisos de tsunami en el Perú los da la
      <a href="https://www.dhn.mil.pe" target="_blank" rel="noopener">Marina de Guerra (DHN)</a>.
    </p>
    <a class="ficha-enlace" :href="sismo.url" target="_blank" rel="noopener">{{ deIGP ? 'Reporte del IGP' : 'Ficha en el USGS' }}<svg class="flecha" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 11 11 5M6 5h5v5" /></svg></a>
  </article>
</template>
