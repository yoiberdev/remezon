// El USGS describe cada sismo en inglés: «23 km E of Palora, Ecuador», «near the coast of central
// Peru», «Peru-Ecuador border region». Esto lo pasa al español con las formas que más usa para esta
// zona; lo que no reconoce se queda como viene, con los países traducidos.

const RUMBOS: Record<string, string> = {
  N: 'norte', NNE: 'nornoreste', NE: 'noreste', ENE: 'estenoreste',
  E: 'este', ESE: 'estesureste', SE: 'sureste', SSE: 'sursureste',
  S: 'sur', SSW: 'sursuroeste', SW: 'suroeste', WSW: 'oestesuroeste',
  W: 'oeste', WNW: 'oestenoroeste', NW: 'noroeste', NNW: 'nornoroeste',
}

const PAISES: Record<string, string> = {
  Peru: 'Perú', Brazil: 'Brasil', Bolivia: 'Bolivia', Chile: 'Chile', Ecuador: 'Ecuador', Colombia: 'Colombia',
}

const PARTES: Record<string, string> = { northern: 'norte', central: 'centro', southern: 'sur', western: 'oeste', eastern: 'este' }

const paises = (t: string) => t.replace(/\b(Peru|Brazil|Bolivia|Chile|Ecuador|Colombia)\b/g, (p) => PAISES[p] ?? p)

/** «central Peru» → «centro del Perú»; «Bolivia» → «Bolivia». */
function zona(t: string): string {
  const m = t.match(/^(northern|central|southern|western|eastern) (.+)$/i)
  if (!m) return paises(t)
  const lugar = paises(m[2]!)
  return `${PARTES[m[1]!.toLowerCase()]} ${lugar === 'Perú' ? 'del Perú' : `de ${lugar}`}`
}

export function traducirLugar(lugar: string | null | undefined): string {
  if (!lugar) return 'Lugar sin nombre'
  let m = lugar.match(/^(\d+) km ([NSEW]{1,3}) of (.+)$/)
  if (m) return `${m[1]} km al ${RUMBOS[m[2]!] ?? m[2]} de ${paises(m[3]!)}`
  m = lugar.match(/^near the coast of (.+)$/i)
  if (m) return `frente a la costa, ${zona(m[1]!)}`
  m = lugar.match(/^off the coast of (.+)$/i)
  if (m) return `mar adentro, ${zona(m[1]!)}`
  m = lugar.match(/^(.+?)-(.+?) border region$/i)
  if (m) return `frontera entre ${paises(m[1]!)} y ${paises(m[2]!)}`
  return zona(lugar)
}
