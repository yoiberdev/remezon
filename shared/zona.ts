// La zona del mapa y cómo se pasa de grados y kilómetros a la escena. La comparten el servidor (para
// pedir al USGS solo esta zona), scripts/datos.py (que la repite: si cambia aquí, cambia allá) y la
// escena 3D.

export const OESTE = -82.5
export const ESTE = -67.5
export const NORTE = 0.5
export const SUR = -19
/** Paso de la rejilla del relieve, en grados (scripts/datos.py). */
export const PASO = 0.05

/** El centro de la escena. */
const LON0 = -75
const LAT0 = -9.25
/** Kilómetros por unidad de la escena. */
export const KM = 100
/** El relieve va exagerado: los Andes a escala real serían una lámina de 6 km sobre 1 600. */
export const EXAGERACION = 12
/** El fondo del mar, menos: con doce veces la fosa bajaría a 84 km y taparía los sismos de la costa. */
export const EXAGERACION_MAR = 2
const KM_LON = 111.32 * Math.cos((LAT0 * Math.PI) / 180)
const KM_LAT = 110.57

export const anchoMapa = ((ESTE - OESTE) * KM_LON) / KM
export const altoMapa = ((NORTE - SUR) * KM_LAT) / KM

/** Longitud y latitud a la escena: x hacia el este, z hacia el sur. */
export function proyectar(lon: number, lat: number): { x: number; z: number } {
  return { x: ((lon - LON0) * KM_LON) / KM, z: ((LAT0 - lat) * KM_LAT) / KM }
}

/** Una profundidad en km a la altura de la escena (hacia abajo, a escala real). */
export const bajoTierra = (km: number) => -km / KM

/** Una altura del relieve en metros a la escena (exagerada; el mar, menos). */
export const sobreTierra = (m: number) => (m / 1000 / KM) * (m > 0 ? EXAGERACION : EXAGERACION_MAR)
