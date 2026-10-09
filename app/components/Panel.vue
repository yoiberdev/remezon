<script setup lang="ts">
import type { Periodo, Sismo } from '~/composables/useSismos'

// EL PANEL: el período, la ficha del sismo elegido y la lista. En el celular baja al borde de abajo y
// la lista se despliega con un botón.

defineProps<{ cargando: boolean; fallo: boolean }>()
const { periodo, seleccionado, sismos, ultimo, elegido } = useSismos()
const ahora = useAhora()

const PERIODOS: [Periodo, string][] = [
  ['dia', '24 horas'],
  ['semana', '7 días'],
  ['mes', '30 días'],
]
const EN_TEXTO: Record<Periodo, string> = { dia: 'las últimas 24 horas', semana: 'los últimos 7 días', mes: 'los últimos 30 días' }

const orden = ref<'recientes' | 'fuertes'>('recientes')
const lista = computed(() =>
  orden.value === 'recientes' ? sismos.value : [...sismos.value].sort((a, b) => b.mag - a.mag || b.t - a.t),
)
const mayor = computed(() => sismos.value.reduce<Sismo | null>((m, s) => (!m || s.mag > m.mag ? s : m), null))
const abierto = ref(false)

// En la lista basta el departamento: «Condorcanqui, Amazonas» → «Amazonas».
const region = (l: string) => partirLugar(l).region?.split(', ').pop()

function elegir(id: string) {
  seleccionado.value = id
}
</script>

<template>
  <aside class="panel" :class="{ abierto }" aria-label="Sismos del período">
    <div class="periodos" role="radiogroup" aria-label="Período">
      <button
        v-for="[v, t] in PERIODOS"
        :key="v"
        role="radio"
        :aria-checked="periodo === v"
        @click="periodo = v"
      >
        {{ t }}
      </button>
    </div>

    <FichaSismo v-if="elegido" :sismo="elegido" :es-ultimo="elegido.id === ultimo?.id" />
    <p v-else-if="fallo" class="panel-nota">No pude traer los sismos. Lo vuelvo a intentar en un minuto.</p>
    <p v-else-if="cargando" class="panel-nota">Pidiendo los sismos…</p>
    <p v-else class="panel-nota">Ningún sismo reportado en {{ EN_TEXTO[periodo] }}. Prueba con un período más largo.</p>

    <template v-if="sismos.length">
      <div class="panel-cabeza">
        <p>
          <b>{{ sismos.length }}</b> {{ sismos.length === 1 ? 'sismo' : 'sismos' }} en {{ EN_TEXTO[periodo] }}<template v-if="mayor && sismos.length > 1">;
            el más fuerte, <b>M {{ magnitud(mayor.mag) }}</b></template>
        </p>
        <div class="orden" role="radiogroup" aria-label="Orden de la lista">
          <button role="radio" :aria-checked="orden === 'recientes'" @click="orden = 'recientes'">Recientes</button>
          <button role="radio" :aria-checked="orden === 'fuertes'" @click="orden = 'fuertes'">Más fuertes</button>
        </div>
      </div>
      <button class="desplegar" :aria-expanded="abierto" @click="abierto = !abierto">
        {{ abierto ? 'Ocultar la lista' : `Ver los ${sismos.length}` }}
      </button>
      <ol class="lista">
        <li v-for="s in lista" :key="s.id">
          <button
            class="fila"
            :aria-current="s.id === elegido?.id ? 'true' : undefined"
            :style="{ '--tono': colorProfundidad(s.prof) }"
            @click="elegir(s.id)"
          >
            <span class="fila-mag">{{ magnitud(s.mag) }}</span>
            <span class="fila-texto">
              <b>{{ partirLugar(s.lugar).lugar }}</b>
              <small>{{ hace(s.t, ahora) }} · {{ kilometros(s.prof) }}<template v-if="partirLugar(s.lugar).region"> · {{ region(s.lugar) }}</template></small>
            </span>
            <Hondura :km="s.prof" compacto />
          </button>
        </li>
      </ol>
    </template>
  </aside>
</template>
