// Los sismos de la zona: los del período elegido, en vivo (el servidor de /api/sismos, del IGP o del
// USGS, cada minuto), y el catálogo histórico desde 1973 (public/datos/historicos.json, de
// scripts/datos.py).

export interface Sismo {
  id: string
  mag: number
  lugar: string
  t: number
  lon: number
  lat: number
  prof: number
  url: string
  intensidad: string | null
  sentido: number | null
  tsunami: boolean
}

export type Periodo = 'dia' | 'semana' | 'mes'
export const DIAS: Record<Periodo, number> = { dia: 1, semana: 7, mes: 30 }

interface Respuesta {
  periodo: Periodo
  fuente: 'IGP' | 'USGS'
  actualizado: number
  sismos: Sismo[]
}

/** [lon, lat, profundidad, magnitud, año] */
export type Historico = [number, number, number, number, number]

/** El estado que comparten la escena y los paneles. */
export function useSismos() {
  const periodo = useState<Periodo>('periodo', () => 'semana')
  const seleccionado = useState<string | null>('seleccionado', () => null)
  const conHistoria = useState('conHistoria', () => true)
  const respuesta = useState<Respuesta | null>('respuesta', () => null)
  const sismos = computed<Sismo[]>(() => respuesta.value?.sismos ?? [])
  const actualizado = computed(() => respuesta.value?.actualizado ?? 0)
  const fuente = computed(() => respuesta.value?.fuente ?? null)
  const ultimo = computed(() => sismos.value[0] ?? null)
  const elegido = computed(() => sismos.value.find((s) => s.id === seleccionado.value) ?? ultimo.value)
  return { periodo, seleccionado, conHistoria, sismos, actualizado, fuente, ultimo, elegido }
}

/** Pide al servidor los sismos del período y los vuelve a pedir cada minuto. Va una sola vez, en app.vue. */
export function usePedirSismos() {
  const { periodo } = useSismos()
  const respuesta = useState<Respuesta | null>('respuesta')
  const { data, status, error, refresh } = useFetch<Respuesta>('/api/sismos', { query: { periodo }, server: false })
  watch(data, (d) => {
    if (d) respuesta.value = d
  })

  let reloj: ReturnType<typeof setInterval> | undefined
  const alVolver = () => document.visibilityState === 'visible' && refresh()
  onMounted(() => {
    reloj = setInterval(() => document.visibilityState === 'visible' && refresh(), 60_000)
    document.addEventListener('visibilitychange', alVolver)
  })
  onBeforeUnmount(() => {
    clearInterval(reloj)
    document.removeEventListener('visibilitychange', alVolver)
  })
  return { status, error }
}

/** La hora de ahora, que avanza sola cada 20 segundos (para los «hace 5 minutos»). */
export function useAhora() {
  return useState('ahora', () => Date.now())
}
export function useRelojAhora() {
  const ahora = useAhora()
  let reloj: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    ahora.value = Date.now()
    reloj = setInterval(() => (ahora.value = Date.now()), 20_000)
  })
  onBeforeUnmount(() => clearInterval(reloj))
}

export function useHistoricos() {
  const { data } = useFetch<Historico[]>('/datos/historicos.json', { server: false, key: 'historicos' })
  return computed(() => data.value ?? [])
}
