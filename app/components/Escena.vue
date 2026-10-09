<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { CameraControls } from '@tresjs/cientos'
import { NoToneMapping, Vector3 } from 'three'
import { bajoTierra, proyectar } from '#shared/zona'

// LA ESCENA: el relieve, la caja de profundidad, medio siglo de sismos y los del período. La cámara
// tiene cuatro vistas (useState('vista'), los botones de Vistas.vue) y vuela al sismo que se elija.

const { sismos, elegido, seleccionado, conHistoria } = useSismos()
const historicos = useHistoricos()
const vista = useState<string>('vista', () => 'tres')
const vuelta = useState('vistaVuelta', () => 0)

type V3 = [number, number, number]
// La cámara tiene un ángulo cerrado (24°) y se pone lejos: así la perspectiva casi no deforma y el
// corte se lee como un perfil.
const VISTAS: Record<string, { pos: V3; mira: V3 }> = {
  // De costado, desde el suroeste y poco por encima del mar: el relieve arriba y los sismos debajo.
  tres: { pos: [-20.6, 2.6, 28], mira: [0.4, -2.9, 0.6] },
  // Desde arriba: el mapa.
  mapa: { pos: [0.01, 50, 9], mira: [0, -0.5, 0.8] },
  // El corte: desde el sureste, a lo largo de la costa (que corre de sureste a noroeste) y a la altura
  // de la placa. Así todos los sismos caen en un mismo perfil y dibujan la placa que baja al noreste.
  corte: { pos: [23.4, -2.6, 28.2], mira: [0.8, -2.6, 0.2] },
  // Desde abajo, a través del suelo.
  abajo: { pos: [-12, -30, 16], mira: [0, -2.5, 0] },
}

interface Controles {
  setLookAt: (...a: [number, number, number, number, number, number, boolean]) => Promise<void>
}
const controles = shallowRef<{ instance: Controles | null } | null>(null)
const quieto = import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches
// En una pantalla vertical (el celular) el ángulo horizontal es muy cerrado: la cámara se aleja un poco.
function ir(pos: V3, mira: V3, suave = !quieto) {
  const k = innerWidth < innerHeight ? 1.6 : 1
  const lejos = pos.map((p, i) => mira[i]! + (p - mira[i]!) * k) as V3
  return controles.value?.instance?.setLookAt(...lejos, ...mira, suave)
}

// LA BRÚJULA Y LA ESCALA de la leyenda: hacia dónde queda el norte en la pantalla, y cuántos
// píxeles son 100 km a la altura del punto que mira la cámara (solo vale mirando desde arriba).
const brujula = useState('brujula', () => ({ rumbo: 0, pxPor100km: 0, planta: true }))
const camPos = new Vector3()
const camMira = new Vector3()
let pendiente = 0
function medir(c: { getPosition: (v: Vector3) => Vector3; getTarget: (v: Vector3) => Vector3 }) {
  cancelAnimationFrame(pendiente)
  pendiente = requestAnimationFrame(() => {
    c.getPosition(camPos)
    c.getTarget(camMira)
    const dir = camMira.clone().sub(camPos)
    const d = dir.length()
    const rumbo = (Math.atan2(dir.x, -dir.z) * 180) / Math.PI
    const inclinacion = Math.asin(Math.min(1, -dir.y / d))
    const alto = 2 * d * Math.tan((24 / 2) * (Math.PI / 180))
    brujula.value = { rumbo: -rumbo, pxPor100km: innerHeight / alto, planta: inclinacion > 1.05 }
  })
}

// La entrada: de lejos y desde arriba hasta la vista de costado.
const stop = watch(
  () => controles.value?.instance,
  (c) => {
    if (!c) return
    stop()
    const d = VISTAS[vista.value] ?? VISTAS.tres!
    if (quieto) return ir(d.pos, d.mira, false)
    ir([-8, 80, 60], [0, -2, 0], false)
    setTimeout(() => ir(d.pos, d.mira), 60)
  },
)

watch([vista, vuelta], ([v]) => {
  const d = VISTAS[v]
  if (d) ir(d.pos, d.mira)
})

// Al elegir un sismo, la cámara se acerca a él, un poco por encima y al costado. Ninguna de las cuatro
// vistas queda marcada (y tocar cualquiera vuelve a ella).
watch(seleccionado, (id) => {
  if (!id) return
  const s = sismos.value.find((x) => x.id === id)
  if (!s) return
  vista.value = 'libre'
  const { x, z } = proyectar(s.lon, s.lat)
  const y = bajoTierra(s.prof)
  ir([x - 6.5, y + 4.5, z + 8.5], [x, y, z])
})
</script>

<template>
  <TresCanvas clear-color="#f5f5f1" :tone-mapping="NoToneMapping" :dpr="[1, 2]" antialias>
    <TresPerspectiveCamera :position="VISTAS.tres!.pos" :fov="24" :near="0.1" :far="400" />
    <CameraControls ref="controles" make-default :min-distance="4" :max-distance="95" :smooth-time="0.7" @change="medir" />
    <!-- La luz de un sombreado de relieve: desde el noroeste, como en las cartas. -->
    <TresHemisphereLight :args="['#ffffff', '#cfc9bd', 1.6]" />
    <TresDirectionalLight :position="[-12, 14, -10]" :intensity="1.9" />
    <Encuadre />
    <Relieve />
    <Caja />
    <PuntosHistoricos v-if="conHistoria" :lista="historicos" />
    <PuntosVivos :lista="sismos" :elegido="elegido" :quieto="quieto" @elegir="(id: string) => (seleccionado = id)" />
    <Ciudades v-if="vista !== 'corte'" />
  </TresCanvas>
</template>
