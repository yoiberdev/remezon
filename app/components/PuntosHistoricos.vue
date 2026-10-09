<script setup lang="ts">
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { bajoTierra, proyectar } from '#shared/zona'
import type { Historico } from '~/composables/useSismos'

// MEDIO SIGLO DE SISMOS: los 5 937 de magnitud 4,5 o más desde 1973, cada uno a su profundidad real.
// Mirados de costado dibujan la placa de Nazca: los superficiales pegados a la costa, los intermedios
// bajo los Andes y los más hondos, a más de 500 km, en la frontera con Brasil. Una sola malla
// instanciada para todos.

const props = defineProps<{ lista: Historico[] }>()

const geometria = new SphereGeometry(1, 10, 8)
const material = new MeshBasicMaterial({ transparent: true, opacity: 0.62, depthWrite: false })
const malla = shallowRef<InstancedMesh | null>(null)

watch(
  () => props.lista,
  (lista) => {
    malla.value?.dispose()
    if (!lista.length) {
      malla.value = null
      return
    }
    const m = new InstancedMesh(geometria, material, lista.length)
    const o = new Object3D()
    const c = new Color()
    lista.forEach(([lon, lat, prof, mag], i) => {
      const { x, z } = proyectar(lon, lat)
      o.position.set(x, bajoTierra(prof), z)
      o.scale.setScalar(radioMagnitud(mag) * 0.8)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(colorProfundidad(prof)))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    malla.value = m
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  malla.value?.dispose()
  geometria.dispose()
  material.dispose()
})
</script>

<template>
  <primitive v-if="malla" :object="malla" />
</template>
