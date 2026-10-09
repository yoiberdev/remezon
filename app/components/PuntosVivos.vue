<script setup lang="ts">
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  RingGeometry,
  SphereGeometry,
  Mesh,
  DoubleSide,
} from 'three'
import { useLoop } from '@tresjs/core'
import { Html } from '@tresjs/cientos'
import { bajoTierra, proyectar, sobreTierra } from '#shared/zona'
import type { Sismo } from '~/composables/useSismos'

// LOS SISMOS DEL PERÍODO: más grandes y encendidos que los históricos, cada uno con su línea desde el
// epicentro (en la superficie) hasta el hipocentro (donde de verdad se rompió la roca). Se dibujan
// encima de todo, como por rayos X, para que el relieve no los tape desde ningún ángulo. Los de las
// últimas 24 horas laten. El elegido lleva un aro en la superficie y su rótulo.

const props = defineProps<{ lista: Sismo[]; elegido: Sismo | null; quieto?: boolean }>()
const emit = defineEmits<{ elegir: [id: string] }>()

// Los puntos se pueden tocar: el evento de Tres trae el índice de la instancia.
function tocar(e: { instanceId?: number; stopPropagation?: () => void }) {
  const s = e.instanceId != null ? props.lista[e.instanceId] : undefined
  if (!s) return
  e.stopPropagation?.()
  emit('elegir', s.id)
}
const mano = (si: boolean) => (document.body.style.cursor = si ? 'pointer' : '')

const esfera = new SphereGeometry(1, 16, 12)
const material = new MeshBasicMaterial({ toneMapped: false, depthTest: false })
const halo = new MeshBasicMaterial({ transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false })
const lineas = new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.32, depthTest: false })
const aro = new Mesh(new RingGeometry(0.2, 0.25, 48), new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, side: DoubleSide, depthWrite: false }))
aro.rotation.x = -Math.PI / 2
aro.renderOrder = 5

const puntos = shallowRef<InstancedMesh | null>(null)
const halos = shallowRef<InstancedMesh | null>(null)
const varillas = shallowRef<LineSegments | null>(null)
const recientes = ref<number[]>([])
const superficie = ref<Record<string, number>>({})

const o = new Object3D()
const c = new Color()

async function armar(lista: Sismo[]) {
  puntos.value?.dispose()
  halos.value?.dispose()
  varillas.value?.geometry.dispose()
  if (!lista.length) {
    puntos.value = halos.value = null
    varillas.value = null
    return
  }
  const r = await cargarRelieve()
  const p = new InstancedMesh(esfera, material, lista.length)
  const h = new InstancedMesh(esfera, halo, lista.length)
  const tramos: number[] = []
  const alturas: Record<string, number> = {}
  const ahora = Date.now()
  recientes.value = []
  lista.forEach((s, i) => {
    const { x, z } = proyectar(s.lon, s.lat)
    const y = bajoTierra(s.prof)
    const arriba = sobreTierra(Math.max(0, r.en(s.lon, s.lat)))
    alturas[s.id] = arriba
    o.position.set(x, y, z)
    o.scale.setScalar(radioVivo(s.mag))
    o.updateMatrix()
    p.setMatrixAt(i, o.matrix)
    h.setMatrixAt(i, o.matrix)
    c.set(colorProfundidad(s.prof))
    p.setColorAt(i, c)
    h.setColorAt(i, c)
    tramos.push(x, arriba, z, x, y, z)
    if (ahora - s.t < 86400e3) recientes.value.push(i)
  })
  p.instanceMatrix.needsUpdate = true
  h.instanceMatrix.needsUpdate = true
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(tramos, 3))
  superficie.value = alturas
  p.renderOrder = 4
  h.renderOrder = 3
  const v = new LineSegments(g, lineas)
  v.renderOrder = 2
  puntos.value = p
  halos.value = h
  varillas.value = v
}

watch(() => props.lista, armar, { immediate: true })

// El elegido: un aro en la superficie, sobre su epicentro.
const elegidoPos = computed(() => {
  const s = props.elegido
  if (!s) return null
  const { x, z } = proyectar(s.lon, s.lat)
  return { x, z, y: bajoTierra(s.prof), arriba: superficie.value[s.id] ?? 0 }
})

// El latido de los de las últimas 24 horas, y el del aro.
const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  const h = halos.value
  if (h && recientes.value.length && !props.quieto) {
    const lista = props.lista
    for (const i of recientes.value) {
      const s = lista[i]
      if (!s) continue
      const { x, z } = proyectar(s.lon, s.lat)
      const f = (elapsed * 0.6 + i * 0.37) % 1
      o.position.set(x, bajoTierra(s.prof), z)
      o.scale.setScalar(radioVivo(s.mag) * (1.2 + f * 2.6))
      o.updateMatrix()
      h.setMatrixAt(i, o.matrix)
    }
    h.instanceMatrix.needsUpdate = true
  }
  const e = elegidoPos.value
  if (e) {
    aro.position.set(e.x, e.arriba + 0.02, e.z)
    aro.scale.setScalar(props.quieto ? 1 : 1 + 0.25 * Math.sin(elapsed * 3))
  }
})

onBeforeUnmount(() => {
  mano(false)
  puntos.value?.dispose()
  halos.value?.dispose()
  varillas.value?.geometry.dispose()
  esfera.dispose()
  material.dispose()
  halo.dispose()
  lineas.dispose()
})
</script>

<template>
  <primitive v-if="varillas" :object="varillas" />
  <primitive v-if="halos" :object="halos" />
  <primitive v-if="puntos" :object="puntos" @click="tocar" @pointerenter="mano(true)" @pointerleave="mano(false)" />
  <primitive v-if="elegidoPos" :object="aro" />
  <Html v-if="elegido && elegidoPos" :position="[elegidoPos.x, elegidoPos.y, elegidoPos.z]" :pointer-events="'none'" :z-index-range="[9, 0]">
    <div class="rotulo-sismo" :style="{ '--tono': colorProfundidad(elegido.prof) }">
      <b>M {{ magnitud(elegido.mag) }}</b>
      <span>{{ kilometros(elegido.prof) }} bajo tierra</span>
    </div>
  </Html>
</template>
