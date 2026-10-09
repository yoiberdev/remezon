<script setup lang="ts">
import { BoxGeometry, BufferGeometry, DoubleSide, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import { Html } from '@tresjs/cientos'
import { altoMapa, anchoMapa, bajoTierra } from '#shared/zona'

// LA CAJA DE PROFUNDIDAD: el volumen bajo el mapa hasta 700 km, dibujado como el corte de una carta
// geológica. Las caras del fondo (norte) y del oeste llevan las tres franjas de profundidad en su
// color, muy claras, con una raya cada 100 km; la cifra va en la arista de adelante. Es lo que deja
// leer a qué profundidad está cada sismo cuando se mira de costado.

const FONDO = 700
const alto = -bajoTierra(FONDO)
const TINTA = '#1b1d1f'
const material = new LineBasicMaterial({ color: TINTA, transparent: true, opacity: 0.42 })
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
  puntos.push(x0, y, z0, x1, y, z0, x0, y, z0, x0, y, z1)
  marcas.push({ km, y })
}
const geo = new BufferGeometry()
geo.setAttribute('position', new Float32BufferAttribute(puntos, 3))
const rayas = new LineSegments(geo, new LineBasicMaterial({ color: TINTA, transparent: true, opacity: 0.18 }))

// Las franjas: superficial, intermedia y profunda, en las dos caras del fondo.
const tramos: [number, number, string][] = [
  [0, FRONTERAS.intermedio, COLORES.superficial],
  [FRONTERAS.intermedio, FRONTERAS.profundo, COLORES.intermedio],
  [FRONTERAS.profundo, FONDO, COLORES.profundo],
]
const franjas: Mesh[] = []
for (const [desde, hasta, color] of tramos) {
  const yA = bajoTierra(desde)
  const yB = bajoTierra(hasta)
  const h = yA - yB
  const mat = new MeshBasicMaterial({ color, transparent: true, opacity: 0.075, side: DoubleSide, depthWrite: false })
  const norte = new Mesh(new PlaneGeometry(anchoMapa, h), mat)
  norte.position.set(0, (yA + yB) / 2, z0)
  const oeste = new Mesh(new PlaneGeometry(altoMapa, h), mat)
  oeste.rotation.y = Math.PI / 2
  oeste.position.set(x0, (yA + yB) / 2, 0)
  franjas.push(norte, oeste)
}

onBeforeUnmount(() => {
  aristas.geometry.dispose()
  geo.dispose()
  material.dispose()
  ;(rayas.material as LineBasicMaterial).dispose()
  for (const f of franjas) {
    f.geometry.dispose()
    ;(f.material as MeshBasicMaterial).dispose()
  }
})
</script>

<template>
  <primitive v-for="(f, i) in franjas" :key="i" :object="f" />
  <primitive :object="aristas" />
  <primitive :object="rayas" />
  <Html v-for="m in marcas" :key="m.km" :position="[x0, m.y, z1]" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="marca-km">{{ m.km }} km</span>
  </Html>
  <Html :position="[x0, 0, z1]" center :pointer-events="'none'" :z-index-range="[9, 0]">
    <span class="marca-km">nivel del mar</span>
  </Html>
</template>
