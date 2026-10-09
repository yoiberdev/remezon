<script setup lang="ts">
// EL SISMOGRAMA DEL PERÍODO: una línea de tiempo dibujada como el papel de un sismógrafo. Cada sismo
// es una sacudida que crece con la magnitud y se apaga sola; el trazo es ilustrativo (sale de las
// magnitudes, no de una estación). Los puntos de abajo se pueden tocar para elegir el sismo.

const { sismos, periodo, elegido, seleccionado, actualizado } = useSismos()
const ahora = useAhora()

const caja = ref<HTMLElement | null>(null)
const ancho = ref(640)
const ALTO = 78
const MEDIO = 34
let observador: ResizeObserver | undefined
onMounted(() => {
  observador = new ResizeObserver(([e]) => (ancho.value = Math.max(120, Math.round(e!.contentRect.width))))
  if (caja.value) observador.observe(caja.value)
})
onBeforeUnmount(() => observador?.disconnect())

const fin = computed(() => actualizado.value || ahora.value)
const inicio = computed(() => fin.value - DIAS[periodo.value] * 86400e3)
const enX = (t: number) => ((t - inicio.value) / (fin.value - inicio.value)) * ancho.value

const traza = computed(() => {
  const W = ancho.value
  const y = new Float32Array(W + 1)
  // El temblor de fondo de cualquier estación: fijo, para que no baile al refrescar.
  for (let i = 0; i <= W; i++) y[i] = Math.sin(i * 1.7) * 0.4 + Math.sin(i * 0.61 + 1) * 0.35
  const tope = MEDIO - 4
  for (const s of sismos.value) {
    const x0 = enX(s.t)
    // De magnitud 2.5 (casi nada) a 8 (el trazo toca el borde).
    const fuerza = tope * Math.min(1, Math.max(0.06, (s.mag - 2.5) / 5.5)) ** 0.9
    const coda = 4 + s.mag * 3.2
    const desde = Math.max(0, Math.ceil(x0))
    const hasta = Math.min(W, Math.floor(x0 + coda * 5))
    for (let i = desde; i <= hasta; i++) {
      const dx = i - x0
      y[i] = y[i]! + fuerza * Math.min(1, dx / 1.2 + 0.25) * Math.exp(-dx / coda) * Math.sin(dx * 2.4)
    }
  }
  let d = ''
  for (let i = 0; i <= W; i++) d += `${i ? 'L' : 'M'}${i} ${(MEDIO - Math.max(-tope, Math.min(tope, y[i]!))).toFixed(1)}`
  return d
})

// Las rayas del tiempo, en hora de Lima (UTC−5, sin horario de verano).
const LIMA = -5 * 3600e3
const hora = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Lima' })
const dia = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' })
const rayas = computed(() => {
  const p = periodo.value
  const paso = p === 'dia' ? 3 * 3600e3 : 86400e3
  const cada = p === 'mes' ? (ancho.value < 700 ? 7 : 3) : p === 'semana' && ancho.value < 420 ? 2 : 1
  const salida: { x: number; texto: string | null }[] = []
  let t = Math.ceil((inicio.value + LIMA) / paso) * paso - LIMA
  let k = 0
  for (; t < fin.value; t += paso, k++) {
    const x = enX(t)
    // Sin cifra cerca del borde derecho: ahí va «ahora».
    const texto = k % cada || x > ancho.value - 52 ? null : p === 'dia' ? `${hora.format(t)} h` : dia.format(t).replace('.', '')
    salida.push({ x, texto })
  }
  return salida
})

const puntos = computed(() =>
  sismos.value.map((s) => ({ id: s.id, x: enX(s.t), r: 1.6 + Math.max(0, s.mag - 2.5) * 0.9, tono: colorProfundidad(s.prof), s })),
)
const marca = computed(() => (elegido.value ? enX(elegido.value.t) : null))
const NOMBRE: Record<string, string> = { dia: 'las últimas 24 horas', semana: 'los últimos 7 días', mes: 'los últimos 30 días' }
</script>

<template>
  <section class="sismograma" aria-label="Sismograma del período">
    <p class="rotulo">
      <span>Sismograma de {{ NOMBRE[periodo] }}</span>
      <span class="sismograma-nota">trazo ilustrativo, hecho con las magnitudes</span>
    </p>
    <div ref="caja" class="sismograma-papel">
      <svg :width="ancho" :height="ALTO" :viewBox="`0 0 ${ancho} ${ALTO}`" role="img" :aria-label="`${sismos.length} sismos en ${NOMBRE[periodo]}`">
        <g class="sismograma-rayas">
          <template v-for="r in rayas" :key="r.x">
            <line :x1="r.x" :x2="r.x" y1="2" :y2="r.texto ? ALTO - 12 : ALTO - 16" :class="{ fuerte: r.texto }" />
            <text v-if="r.texto" :x="r.x + 3" :y="ALTO - 2">{{ r.texto }}</text>
          </template>
        </g>
        <line v-if="marca !== null" class="sismograma-elegido" :x1="marca" :x2="marca" y1="0" :y2="ALTO - 14" :style="{ stroke: elegido ? colorProfundidad(elegido.prof) : undefined }" />
        <path class="sismograma-traza" :d="traza" />
        <text class="sismograma-ahora" :x="ancho" :y="ALTO - 2" text-anchor="end">ahora</text>
        <g class="sismograma-puntos">
          <circle
            v-for="p in puntos"
            :key="p.id"
            :cx="p.x"
            :cy="MEDIO"
            :r="p.r"
            :fill="p.tono"
            :class="{ activo: p.id === elegido?.id }"
            @click="seleccionado = p.id"
          >
            <title>M {{ magnitud(p.s.mag) }} · {{ p.s.lugar }} · {{ fechaLima(p.s.t) }}</title>
          </circle>
        </g>
      </svg>

    </div>
  </section>
</template>
