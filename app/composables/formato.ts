// Colores, tamaños y textos que comparten la escena y los paneles.

/** Por profundidad, con los cortes que usa el IGP: superficial hasta 60 km, intermedio hasta 300 y
 *  profundo más abajo. Rojo, verde y azul, tintas de imprenta que se leen sobre el papel de la carta. */
export const COLORES = { superficial: '#d7301f', intermedio: '#1a9850', profundo: '#2166ac' } as const
export const FRONTERAS = { intermedio: 60, profundo: 300 } as const

export type TipoProfundidad = keyof typeof COLORES

// Va como constante: escrita como función con este tipo de retorno, los auto-imports de Nuxt no la
// encontraban.
export const tipoProfundidad = (km: number): TipoProfundidad =>
  km < FRONTERAS.intermedio ? 'superficial' : km < FRONTERAS.profundo ? 'intermedio' : 'profundo'
export const colorProfundidad = (km: number) => COLORES[tipoProfundidad(km)]

/** El radio de un punto en la escena: crece con la magnitud, que es logarítmica. */
export const radioMagnitud = (m: number) => 0.045 * Math.pow(1.45, m - 4.5)
/** Los del período van más grandes: el IGP reporta desde magnitud 3 y esos tienen que verse. */
export const radioVivo = (m: number) => 0.08 * Math.pow(1.42, m - 3)

/** «28 km al noroeste de Santa María de Nieva, Condorcanqui - Amazonas» → el lugar y la región. */
export function partirLugar(lugar: string): { lugar: string; region: string | null } {
  const i = lugar.indexOf(', ')
  if (i < 0) return { lugar, region: null }
  return { lugar: lugar.slice(0, i), region: lugar.slice(i + 2).replace(/ - /g, ', ') }
}

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
export function hace(t: number, ahora = Date.now()): string {
  const s = Math.round((t - ahora) / 1000)
  const a = Math.abs(s)
  if (a < 60) return 'hace un momento'
  if (a < 3600) return relativo.format(Math.round(s / 60), 'minute')
  if (a < 86400) return relativo.format(Math.round(s / 3600), 'hour')
  return relativo.format(Math.round(s / 86400), 'day')
}

const fecha = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })
export const fechaLima = (t: number) => fecha.format(t).replace('.', '')

export const magnitud = (m: number) => m.toFixed(1)
export const kilometros = (km: number) => `${Math.round(km)} km`
