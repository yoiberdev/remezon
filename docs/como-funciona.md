# Cómo funciona Remezón

## Los sismos en vivo

`GET /api/sismos?periodo=dia|semana|mes` devuelve los sismos de las últimas 24 horas, 7 días o 30
días, del más nuevo al más viejo:

```json
{
  "periodo": "semana",
  "fuente": "IGP",
  "actualizado": 1791530150217,
  "sismos": [
    {
      "id": "igp-2026-0725",
      "mag": 3.7,
      "lugar": "28 km al noroeste de Santa María de Nieva, Condorcanqui - Amazonas",
      "t": 1791522973000,
      "lon": -77.99,
      "lat": -4.37,
      "prof": 15,
      "url": "https://ultimosismo.igp.gob.pe/evento/2026-0725",
      "intensidad": "II-III Santa María de Nieva",
      "sentido": null,
      "tsunami": false
    }
  ]
}
```

### El IGP

El IGP reporta todo lo que se siente en el país, más o menos desde magnitud 3, unos dos o tres sismos
al día. Su página de sismos reportados lee `ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/AAAA`, la
lista de todo el año (unos 500 KB, 56 KB comprimida). El servidor pide esa lista, la guarda tres
minutos y filtra el período. Si el período empieza el año anterior, pide también esa lista.

Cada reporte trae la fecha y la hora en campos separados (`fecha_utc` y `hora_utc`, la segunda pegada
al 1 de enero de 1970); el servidor los junta. La referencia viene con el rumbo abreviado («28 km al
NO de…») y se escribe completo («28 km al noroeste de…»). Los reportes sin publicar o fuera de la
zona del mapa se descartan.

### El USGS, de respaldo

Si el IGP no responde, el servidor le pide lo mismo al catálogo FDSN del USGS, con la zona del mapa y
desde magnitud 2.5. El USGS publica en esta zona sobre todo los de magnitud 4 o más, así que la lista
sale más corta. Sus lugares vienen en inglés («23 km E of Palora, Ecuador», «near the coast of central
Peru») y `server/utils/lugares.ts` los pasa al español.

La respuesta de `/api/sismos` se guarda un minuto. El navegador la vuelve a pedir cada minuto
mientras la pestaña se ve, y en cuanto vuelve a verse.

## La escena

Todo sale de `shared/zona.ts`. La zona va de 82.5° a 67.5° oeste y de 0.5° norte a 19° sur: el Perú
con un margen. Una unidad de la escena son 100 km, el eje x apunta al este, el z al sur y el y hacia
arriba. Un sismo a 300 km de profundidad queda en y = −3.

El relieve (`Relieve.vue`) es una malla de 301 × 391 vértices, uno cada 0.05° (unos 5.5 km), con el
color por altura, con las tintas hipsométricas de un atlas: azules que se oscurecen hacia la fosa y, en
tierra, del verde de la costa y la selva al ocre y el pardo de la sierra, hasta el blanco de los
nevados. Las montañas van doce veces más
altas que en la realidad y el fondo del mar solo al doble. Con doce veces, la fosa frente a la costa
bajaría a 84 km en la escala de la caja y quedaría por debajo de los sismos de la costa. La malla deja
pasar un poco de luz, así que desde arriba se adivinan los sismos de debajo.

Los 5 937 sismos históricos son una sola malla instanciada (`PuntosHistoricos.vue`). Los del período
(`PuntosVivos.vue`) se dibujan sin prueba de profundidad, como por rayos X, para que el relieve no los
tape desde ningún ángulo; cada uno lleva una línea desde la superficie hasta el hipocentro, y los de
las últimas 24 horas laten.

### Las vistas

La cámara tiene un ángulo cerrado (24°) y se pone lejos, para que la perspectiva casi no deforme. La
vista Corte mira a lo largo de la costa peruana, que corre de sureste a noroeste, a la altura de la
placa: todos los sismos del país caen en un mismo perfil, y la placa baja de izquierda (la costa) a
derecha (la Amazonía). En una pantalla vertical la cámara se aleja un 60 % más, porque el ángulo
horizontal es muy cerrado.

Los paneles tapan parte de la pantalla. `Encuadre.vue` mide el hueco que queda libre y corre el
centro de la imagen hasta ahí con el desplazamiento de vista de la cámara (`setViewOffset`). La
cámara no se mueve, así que los controles siguen girando alrededor del mismo punto.

## El sismograma

La franja de abajo es una línea de tiempo del período, dibujada como el papel de un sismógrafo. Cada
sismo es una sacudida que empieza en su hora, crece con la magnitud (de 2.5, casi nada, a 8, que toca
el borde) y se apaga sola. El trazo es ilustrativo: sale de las magnitudes, no de una estación. Los
puntos de color sobre la línea se pueden tocar para elegir el sismo.

## Los datos fijos

`scripts/datos.py` baja las teselas «Terrarium» de zoom 6 que cubren la zona (quedan en
`scripts/.cache`), las junta, muestrea la rejilla de 0.05° y la guarda en `public/datos/relieve.bin`:
dos enteros de 16 bits con el ancho y el alto, y después las alturas en metros de norte a sur. El
catálogo histórico sale de la misma API del USGS y queda en `public/datos/historicos.json` como
`[lon, lat, profundidad, magnitud, año]`.
