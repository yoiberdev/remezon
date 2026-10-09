import { ESTE, NORTE, OESTE, PASO, SUR } from '#shared/zona'

// El relieve (public/datos/relieve.bin, de scripts/datos.py): dos enteros de 16 bits con el ancho y
// el alto de la rejilla, y después las alturas en metros, fila por fila de norte a sur.

export interface Relieve {
  ancho: number
  alto: number
  alturas: Int16Array
  /** La altura en metros en una longitud y latitud cualquiera, con interpolación bilineal. */
  en(lon: number, lat: number): number
}

let pedido: Promise<Relieve> | null = null

export function cargarRelieve(): Promise<Relieve> {
  pedido ??= fetch('/datos/relieve.bin')
    .then((r) => r.arrayBuffer())
    .then((b) => {
      const vista = new DataView(b)
      const ancho = vista.getInt16(0, true)
      const alto = vista.getInt16(2, true)
      const alturas = new Int16Array(b, 4, ancho * alto)
      const en = (lon: number, lat: number): number => {
        const gx = Math.min(Math.max((lon - OESTE) / PASO, 0), ancho - 1.001)
        const gy = Math.min(Math.max((NORTE - lat) / PASO, 0), alto - 1.001)
        const i = Math.floor(gx)
        const j = Math.floor(gy)
        const fx = gx - i
        const fy = gy - j
        const a = (x: number, y: number) => alturas[y * ancho + x]!
        return (a(i, j) * (1 - fx) + a(i + 1, j) * fx) * (1 - fy) + (a(i, j + 1) * (1 - fx) + a(i + 1, j + 1) * fx) * fy
      }
      return { ancho, alto, alturas, en }
    })
  return pedido
}

export const dentroDeLaZona = (lon: number, lat: number) => lon >= OESTE && lon <= ESTE && lat <= NORTE && lat >= SUR
