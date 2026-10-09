<script setup lang="ts">
// Remezón: la escena 3D a pantalla completa y los paneles encima, armados como una carta: el marco
// graduado alrededor de la hoja, la cartela con el título, el registro, la leyenda y el perfil.

const { status, error } = usePedirSismos()
useRelojAhora()
const { seleccionado, actualizado, fuente, ultimo } = useSismos()
const ahora = useAhora()
const vista = useState<string>('vista', () => 'tres')
const vuelta = useState('vistaVuelta', () => 0)
const listo = useState('relieveListo', () => false)

const cargando = computed(() => status.value === 'pending' || status.value === 'idle')
const enVivo = computed(() => (!actualizado.value ? 'Conectando' : fuente.value ? `En vivo desde el ${fuente.value}` : 'En vivo'))
const cuando = computed(() => (actualizado.value ? `, actualizado ${hace(actualizado.value, ahora.value)}` : ''))

// Cuando entra un sismo nuevo mientras la página está abierta, el nombre se remece.
const remece = ref(false)
watch(
  () => ultimo.value?.id,
  (nuevo, antes) => {
    if (!nuevo || !antes || nuevo === antes) return
    remece.value = false
    requestAnimationFrame(() => (remece.value = true))
    setTimeout(() => (remece.value = false), 1000)
  },
)

// Teclas: 1 a 4 para las vistas, Esc para soltar el sismo elegido.
const TECLAS: Record<string, string> = { 1: 'tres', 2: 'mapa', 3: 'corte', 4: 'abajo' }
function tecla(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return
  const v = TECLAS[e.key]
  if (v) {
    if (vista.value === v) vuelta.value++
    else vista.value = v
  } else if (e.key === 'Escape' && seleccionado.value) {
    // Suelta el sismo y vuelve a la vista general.
    seleccionado.value = null
    if (vista.value === 'libre') vista.value = 'tres'
    else vuelta.value++
  }
}
onMounted(() => addEventListener('keydown', tecla))
onBeforeUnmount(() => removeEventListener('keydown', tecla))
</script>

<template>
  <div class="app">
    <div class="lienzo">
      <ClientOnly>
        <Escena />
      </ClientOnly>
    </div>
    <div class="marco" aria-hidden="true"><i class="marco-n" /><i class="marco-s" /><i class="marco-e" /><i class="marco-o" /></div>
    <p v-if="!listo" class="cargando" role="status">Levantando el relieve del Perú…</p>

    <header class="marca">
      <h1 :class="{ remece }">Remezón</h1>
      <p class="marca-lema">Carta sísmica del Perú, con los sismos en vivo y a su profundidad real</p>
      <p class="en-vivo" :class="{ fallo: error }">
        <i aria-hidden="true" />
        <span v-if="error">Sin conexión, reintentando</span>
        <span v-else>{{ enVivo }}<span class="en-vivo-cuando">{{ cuando }}</span></span>
      </p>
    </header>

    <Vistas />
    <Panel :cargando="cargando" :fallo="!!error" />
    <Sismograma />
    <Leyenda />
  </div>
</template>
