<script setup lang="ts">
// LA LEYENDA: los colores por profundidad, el tamaño por magnitud, el interruptor del medio siglo de
// sismos y la explicación de lo que se está mirando. En el celular se abre con un botón.

const { conHistoria } = useSismos()
const historicos = useHistoricos()
const vista = useState<string>('vista')
const abierta = ref(false)
const cifra = new Intl.NumberFormat('es-PE')

const TRAMOS = [
  ['superficial', 'Superficial', 'hasta 70 km'],
  ['intermedio', 'Intermedio', '70 a 300 km'],
  ['profundo', 'Profundo', 'más de 300 km'],
] as const
const MAGNITUDES = [4, 5, 6, 7].map((m) => ({ m, r: Math.round(radioMagnitud(m) * 70 * 10) / 10 }))
</script>

<template>
  <button class="leyenda-boton" :aria-expanded="abierta" aria-controls="leyenda" @click="abierta = !abierta">
    {{ abierta ? 'Cerrar' : '¿Qué estoy viendo?' }}
  </button>
  <aside id="leyenda" class="leyenda" :class="{ abierta }" aria-label="Leyenda">
    <div class="leyenda-fila">
      <div>
        <p class="rotulo">Profundidad</p>
        <ul class="tramos">
          <li v-for="[k, t, d] in TRAMOS" :key="k" :style="{ '--tono': COLORES[k] }">
            <i />{{ t }}<small>{{ d }}</small>
          </li>
        </ul>
      </div>
      <div>
        <p class="rotulo">Magnitud</p>
        <ul class="tamanos">
          <li v-for="t in MAGNITUDES" :key="t.m">
            <i :style="{ width: `${t.r * 2}px`, height: `${t.r * 2}px` }" />{{ t.m }}
          </li>
        </ul>
      </div>
    </div>

    <label class="interruptor">
      <input v-model="conHistoria" type="checkbox">
      <span class="interruptor-pista" aria-hidden="true" />
      <span>
        Medio siglo de sismos
        <small>{{ historicos.length ? cifra.format(historicos.length) : '…' }} de magnitud 4.5 o más, desde 1973</small>
      </span>
    </label>

    <div class="explica">
      <p>
        Cada punto es un sismo, puesto donde empezó y a su profundidad real. Frente a la costa, la placa de
        Nazca se mete bajo el continente y baja hacia el este. Por eso los sismos de la costa son
        superficiales, los de la sierra pasan los 100 km y cerca de la frontera con Brasil los hay a más de 600.
      </p>
      <p v-if="vista !== 'corte'">
        Ponlo en <b>Corte</b> (tecla 3) y la placa aparece dibujada por los propios sismos.
      </p>
      <p v-else>Esa franja que baja de izquierda a derecha es la placa de Nazca.</p>
      <p class="explica-chico">
        Las montañas van doce veces más altas de lo real y el fondo del mar, al doble, para que se lean.
        La profundidad de los sismos es la real.
      </p>
    </div>

    <p class="creditos">
      Sismos en vivo: <a href="https://ultimosismo.igp.gob.pe/" target="_blank" rel="noopener">IGP</a> (y el USGS
      si el IGP no responde). Medio siglo: catálogo del
      <a href="https://earthquake.usgs.gov/" target="_blank" rel="noopener">USGS</a>. Relieve:
      <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles</a>
      (SRTM, GMTED2010, ETOPO1). Hecho por <a href="https://yoiber.com" target="_blank" rel="noopener">Yoiber Chauca</a>.
    </p>
  </aside>
</template>
