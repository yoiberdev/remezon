import { sismosIGP, sismosUSGS, type SismoVivo } from '../utils/fuentes'

// GET /api/sismos?periodo=dia|semana|mes
// Los sismos de la zona en ese período, del IGP y, si el IGP no responde, del USGS (server/utils/
// fuentes.ts). La respuesta se guarda un minuto.

const DIAS = { dia: 1, semana: 7, mes: 30 } as const
type Periodo = keyof typeof DIAS

export default defineCachedEventHandler(
  async (event) => {
    const p = String(getQuery(event).periodo ?? 'semana')
    const periodo: Periodo = p in DIAS ? (p as Periodo) : 'semana'
    const desde = Date.now() - DIAS[periodo] * 86400e3
    let fuente: 'IGP' | 'USGS' = 'IGP'
    let sismos: SismoVivo[]
    try {
      sismos = await sismosIGP(desde)
    } catch (e) {
      console.warn('[sismos] el IGP no respondió, paso al USGS:', (e as Error).message)
      fuente = 'USGS'
      sismos = await sismosUSGS(desde)
    }
    return { periodo, fuente, actualizado: Date.now(), sismos }
  },
  { maxAge: 60, swr: true, getKey: (event) => `sismos-${String(getQuery(event).periodo ?? 'semana')}` },
)
