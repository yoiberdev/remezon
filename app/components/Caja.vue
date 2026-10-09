<script setup lang="ts">
import { BoxGeometry, BufferGeometry, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three'
import { Html } from '@tresjs/cientos'
import { altoMapa, anchoMapa, bajoTierra } from '#shared/zona'

// LA CAJA DE PROFUNDIDAD: el volumen bajo el mapa hasta 700 km, con una raya cada 100 km en las caras
// del fondo y del oeste, y la cifra en la arista de adelante. Es lo que deja leer a qué profundidad
// está cada sismo cuando se mira de costado.

const FONDO = 700
const alto = -bajoTierra(FONDO)
const material = new LineBasicMaterial({ color: '#9fb3c8', transparent: true, opacity: 0.16 })
const aristas = new LineSegments(new EdgesGeometry(new BoxGeometry(anchoMapa, alto, altoMapa)), material)
aristas.position.y = -alto / 2

const x0 = -anchoMapa / 2
const x1 = anchoMapa / 2
const z0 = -altoMapa / 2
const z1 = altoMapa / 2
const puntos: number[] = []
const marcas: { km: number; y: number }[] = []
for (let km = 100; km < FONDO; km += 100) {
  const y = bajoTierra(km)
  // cara del fondo (norte) y cara oeste
  puntos.push(x0, y, z0, x1, y, z0, x0, y, z0, x0, y, z1)
  marcas.push({ km, y })
}
const geo = new BufferGeometry()
geo.setAttribute('position', new Float32BufferAttribute(puntos, 3))
const rayas = new LineSegments(geo, new LineBasicMaterial({ color: '#9fb3c8', transparent: true, opacity: 0.09 }))

onBeforeUnmount(() => {
  aristas.geometry.dispose()
  geo.dispose()
  material.dispose()
  ;(rayas.material as LineBasicMaterial).dispose()
})
</script>

<template>
  <primitive :object="aristas" />
  <primitive :object="rayas" />
  <Html v-for="m in marcas" :key="m.km" :position="[x0, m.y, z1]" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="marca-km">{{ m.km }} km</span>
  </Html>
  <Html :position="[x0, 0, z1]" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="marca-km">nivel del mar</span>
  </Html>
</template>
