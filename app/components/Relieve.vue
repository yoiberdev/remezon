<script setup lang="ts">
import { BufferAttribute, Color, DoubleSide, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three'
import { altoMapa, anchoMapa, sobreTierra } from '#shared/zona'

// EL RELIEVE: la rejilla de public/datos/relieve.bin hecha malla, con el color por altura. El mar
// lleva su profundidad real (la fosa frente a la costa pasa los 7 km) y la tierra va exagerada
// (shared/zona.ts). Se ve por los dos lados y deja pasar un poco de luz: desde abajo se mira la placa
// a través del suelo, y desde arriba se adivinan los sismos de medio siglo.

// Las tintas hipsométricas de un atlas, en metros: azules que se oscurecen hacia la fosa, y en
// tierra del verde de la costa y la selva al amarillo, el ocre y el pardo de la sierra, hasta el
// blanco de los nevados.
const TRAMOS: [number, string][] = [
  [-7000, '#3b6894'],
  [-4000, '#5d8dba'],
  [-1500, '#8db4d4'],
  [-200, '#b8d3e5'],
  [0, '#d4e6ef'],
  [1, '#a6c78c'],
  [400, '#c4d99a'],
  [1200, '#e8dfa2'],
  [2200, '#e1be85'],
  [3200, '#c79566'],
  [4200, '#a7775b'],
  [4900, '#cdc4bc'],
  [5600, '#ffffff'],
]
const colores = TRAMOS.map(([h, c]) => [h, new Color(c)] as const)

function colorAltura(h: number, salida: Color): Color {
  const [hMin, cMin] = colores[0]!
  if (h <= hMin) return salida.copy(cMin)
  for (let k = 1; k < colores.length; k++) {
    const [h1, c1] = colores[k]!
    if (h <= h1) {
      const [h0, c0] = colores[k - 1]!
      return salida.copy(c0).lerp(c1, (h - h0) / (h1 - h0))
    }
  }
  return salida.copy(colores[colores.length - 1]![1])
}

const malla = shallowRef<Mesh | null>(null)
// Los paneles muestran «cargando» hasta que el relieve está armado.
const listo = useState('relieveListo', () => false)

onMounted(async () => {
  const r = await cargarRelieve()
  const geo = new PlaneGeometry(anchoMapa, altoMapa, r.ancho - 1, r.alto - 1)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.getAttribute('position') as BufferAttribute
  const tintas = new Float32Array(pos.count * 3)
  const c = new Color()
  for (let k = 0; k < pos.count; k++) {
    const h = r.alturas[k]!
    pos.setY(k, sobreTierra(h))
    colorAltura(h, c)
    tintas[k * 3] = c.r
    tintas[k * 3 + 1] = c.g
    tintas[k * 3 + 2] = c.b
  }
  geo.setAttribute('color', new BufferAttribute(tintas, 3))
  geo.computeVertexNormals()
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: DoubleSide, transparent: true, opacity: 0.9 })
  malla.value = new Mesh(geo, material)
  listo.value = true
})

onBeforeUnmount(() => {
  malla.value?.geometry.dispose()
  ;(malla.value?.material as MeshStandardMaterial | undefined)?.dispose()
})
</script>

<template>
  <primitive v-if="malla" :object="malla" />
</template>
