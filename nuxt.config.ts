// Remezón: los sismos del Perú en vivo, en 3D y a su profundidad real.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@tresjs/nuxt'],
  css: [
    '@fontsource-variable/archivo/wdth.css',
    '@fontsource/spectral/400-italic.css',
    '@fontsource/spectral/500-italic.css',
    '~/assets/estilos.css',
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Remezón · los sismos del Perú en vivo',
      meta: [
        { name: 'description', content: 'Los sismos del Perú en vivo y en 3D, cada uno a su profundidad real: la placa de Nazca hundiéndose bajo el continente, dibujada por medio siglo de sismos.' },
        { name: 'theme-color', content: '#f4f3ee' },
        { property: 'og:title', content: 'Remezón · los sismos del Perú en vivo' },
        { property: 'og:description', content: 'Cada sismo a su profundidad real, sobre el relieve del Perú y el fondo del mar.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://sismos.yoiber.dev/' },
        { property: 'og:image', content: 'https://sismos.yoiber.dev/og.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [{ rel: 'icon', href: '/icono.svg', type: 'image/svg+xml' }],
    },
  },
  // Los datos fijos cambian poco (scripts/datos.py); la API ya se guarda un minuto en el servidor.
  // (Nitro aplica estas cabeceras, pero los tipos de reemplazo que Nuxt 4.5 usa aquí no conocen
  // `headers`: de ahí el `as`.)
  routeRules: {
    '/datos/**': { headers: { 'cache-control': 'public, max-age=86400' } },
    '/api/**': { headers: { 'cache-control': 'no-cache' } },
    '/**': { headers: { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-frame-options': 'SAMEORIGIN' } },
  } satisfies Record<string, { headers: Record<string, string> }> as Record<string, object>,
  typescript: { strict: true },
})
