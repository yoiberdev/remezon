<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import type { PerspectiveCamera } from 'three'

// EL ENCUADRE: los paneles tapan los bordes de la pantalla (el de la izquierda y la leyenda en el
// escritorio, el de abajo en el celular). Esto corre el centro de la imagen al centro del hueco que
// queda libre, con el desplazamiento de vista de la cámara, para que la escena no quede debajo de
// un panel. No mueve la cámara: los controles siguen girando alrededor del mismo punto.

const { camera, sizes } = useTresContext()
const hueco = ref({ x: 0, y: 0 })

function medir() {
  const w = innerWidth
  const h = innerHeight
  const caja = (s: string) => document.querySelector(s)?.getBoundingClientRect()
  const visible = (r?: DOMRect) => r && r.width > 0 && r.height > 0
  let izq = 0
  let der = w
  let arriba = 0
  let abajo = h
  const panel = caja('.panel')
  const leyenda = caja('.leyenda')
  const sismograma = caja('.sismograma')
  const vistas = caja('.vistas')
  const cabeza = [caja('.marca'), vistas].filter(visible) as DOMRect[]
  if (w > 760) {
    // La marca va sobre la columna del panel; arriba del hueco solo están los botones de las vistas.
    if (visible(panel)) izq = panel!.right
    if (visible(leyenda)) der = leyenda!.left
    if (visible(sismograma)) abajo = sismograma!.top
    if (visible(vistas)) arriba = vistas!.bottom
  } else {
    if (visible(panel)) abajo = panel!.top
    arriba = Math.max(0, ...cabeza.map((r) => r.bottom))
  }
  hueco.value = { x: Math.round((izq + der) / 2 - w / 2), y: Math.round((arriba + abajo) / 2 - h / 2) }
}

watchEffect(() => {
  const c = camera.activeCamera.value as PerspectiveCamera | undefined
  const w = sizes.width.value
  const h = sizes.height.value
  if (!c?.isPerspectiveCamera || !w || !h) return
  // Correr la ventana al revés de lo que se quiere mover la imagen.
  c.setViewOffset(w, h, -hueco.value.x, -hueco.value.y, w, h)
})

let observador: ResizeObserver | undefined
onMounted(() => {
  observador = new ResizeObserver(() => medir())
  for (const s of ['.panel', '.leyenda', '.sismograma', '.marca', '.vistas']) {
    const el = document.querySelector(s)
    if (el) observador.observe(el)
  }
  addEventListener('resize', medir)
  medir()
})
onBeforeUnmount(() => {
  observador?.disconnect()
  removeEventListener('resize', medir)
})
</script>

<template>
  <TresGroup />
</template>
