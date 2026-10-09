import { ESTE, NORTE, OESTE, SUR } from '#shared/zona'
import { traducirLugar } from './lugares'

// DE DÓNDE SALEN LOS SISMOS EN VIVO.
//
// 1. El IGP (Instituto Geofísico del Perú), la fuente oficial: reporta todo lo que se siente en el
//    país, desde magnitud 3 más o menos, con la referencia en español y la intensidad. Su página de
//    «sismos reportados» lee una lista por año (ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/AAAA);
//    se pide esa misma lista y se guarda tres minutos, así que el IGP recibe a lo más una consulta
//    cada tres minutos por año, venga quien venga. Una lista vencida no se sirve: se pide de nuevo y,
//    si el IGP no contesta, entra el USGS.
// 2. El USGS, si el IGP no responde: su catálogo (FDSN) publica en esta zona sobre todo los de
//    magnitud 4 o más.

export interface SismoVivo {
  id: string
  mag: number
  lugar: string
  t: number
  lon: number
  lat: number
  prof: number
  url: string
  /** Del IGP: «II-III Santa María de Nieva». */
  intensidad: string | null
  /** Del USGS: cuántas personas dijeron que lo sintieron. */
  sentido: number | null
  tsunami: boolean
}

const AGENTE = { 'User-Agent': 'Remezon/1.0 (+https://sismos.yoiber.dev)' }
const dentro = (lon: number, lat: number) => lon >= OESTE && lon <= ESTE && lat <= NORTE && lat >= SUR

// ---------- IGP ----------

interface ReporteIGP {
  codigo: string
  fecha_utc: string | null
  hora_utc: string | null
  latitud: string
  longitud: string
  magnitud: string
  profundidad: number | string
  referencia: string | null
  intensidad: string | null
  publicado: string
}

const RUMBOS_IGP: Record<string, string> = {
  N: 'norte', S: 'sur', E: 'este', O: 'oeste', NE: 'noreste', NO: 'noroeste', SE: 'sureste', SO: 'suroeste',
  NNE: 'nornoreste', ENE: 'estenoreste', ESE: 'estesureste', SSE: 'sursureste',
  SSO: 'sursuroeste', OSO: 'oestesuroeste', ONO: 'oestenoroeste', NNO: 'nornoroeste',
}

/** «28 km al NO de Santa María de Nieva, Condorcanqui - Amazonas» → «28 km al noroeste de …». */
export const lugarIGP = (r: string | null) =>
  r ? r.replace(/^(\d+) km al ([NSEO]{1,3}) de /, (t, km, rumbo) => (RUMBOS_IGP[rumbo] ? `${km} km al ${RUMBOS_IGP[rumbo]} de ` : t)).trim() : 'Lugar sin nombre'

const listaDelAnio = defineCachedFunction(
  (anio: number) =>
    $fetch<ReporteIGP[]>(`https://ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/${anio}`, { headers: AGENTE, timeout: 15_000 }),
  { maxAge: 180, swr: false, name: 'igp', getKey: (anio: number) => String(anio) },
)

export async function sismosIGP(desde: number): Promise<SismoVivo[]> {
  const anios = new Set([new Date(desde).getUTCFullYear(), new Date().getUTCFullYear()])
  const listas = await Promise.all([...anios].map((a) => listaDelAnio(a)))
  const salida: SismoVivo[] = []
  for (const r of listas.flat()) {
    if (!r?.fecha_utc || !r.hora_utc || r.publicado === '0') continue
    const t = Date.parse(`${r.fecha_utc.slice(0, 10)}T${r.hora_utc.slice(11, 19)}Z`)
    const lon = Number(r.longitud)
    const lat = Number(r.latitud)
    const mag = Number(r.magnitud)
    if (!(t >= desde) || !Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(mag) || !dentro(lon, lat)) continue
    salida.push({
      id: `igp-${r.codigo}`,
      mag: Math.round(mag * 10) / 10,
      lugar: lugarIGP(r.referencia),
      t,
      lon,
      lat,
      prof: Number(r.profundidad) || 0,
      url: `https://ultimosismo.igp.gob.pe/evento/${r.codigo}`,
      intensidad: r.intensidad?.trim() || null,
      sentido: null,
      tsunami: false,
    })
  }
  return salida.sort((a, b) => b.t - a.t)
}

// ---------- USGS ----------

interface RasgoUSGS {
  id: string
  geometry: { coordinates: [number, number, number] }
  properties: { mag: number | null; place: string | null; time: number; url: string; felt: number | null; tsunami: number }
}

export async function sismosUSGS(desde: number): Promise<SismoVivo[]> {
  const datos = await $fetch<{ features: RasgoUSGS[] }>('https://earthquake.usgs.gov/fdsnws/event/1/query', {
    query: {
      format: 'geojson',
      orderby: 'time',
      starttime: new Date(desde).toISOString().slice(0, 19),
      minmagnitude: 2.5,
      minlatitude: SUR,
      maxlatitude: NORTE,
      minlongitude: OESTE,
      maxlongitude: ESTE,
    },
    headers: AGENTE,
    timeout: 15_000,
  })
  return datos.features
    .filter((f) => f.properties.mag != null)
    .map((f) => ({
      id: `usgs-${f.id}`,
      mag: Math.round((f.properties.mag ?? 0) * 10) / 10,
      lugar: traducirLugar(f.properties.place),
      t: f.properties.time,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      prof: Math.round((f.geometry.coordinates[2] ?? 0) * 10) / 10,
      url: f.properties.url,
      intensidad: null,
      sentido: f.properties.felt,
      tsunami: f.properties.tsunami === 1,
    }))
}
