"""Prepara los datos fijos de Remezón: el relieve del Perú y el catálogo histórico de sismos.

    python scripts/datos.py

1. EL RELIEVE sale de las teselas «Terrarium» de AWS Open Data (Terrain Tiles, dominio público con
   atribución), que traen la altura en tierra y la profundidad en el mar: así se ve la fosa frente a
   la costa. Se bajan las teselas de zoom 6 que cubren la zona, se juntan y se muestrea una rejilla
   regular en grados. Sale public/datos/relieve.bin: dos enteros de 16 bits (ancho, alto) y después
   las alturas en metros, fila por fila de norte a sur.

2. EL CATÁLOGO HISTÓRICO sale de la API del USGS (FDSN): todos los sismos de magnitud 4,5 o más desde
   1973 en la misma zona. Sale public/datos/historicos.json, una lista compacta de
   [lon, lat, profundidad en km, magnitud, año].

Las teselas se guardan en scripts/.cache para no bajarlas otra vez.
"""
import io
import json
import math
import pathlib
import struct
import urllib.request

from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CACHE = RAIZ / 'scripts' / '.cache'
SALIDA = RAIZ / 'public' / 'datos'

# La zona: el Perú entero con un poco de margen (también un trozo de Ecuador, Colombia, Brasil,
# Bolivia y Chile, donde la placa sigue).
OESTE, ESTE, NORTE, SUR = -82.5, -67.5, 0.5, -19.0
# Una celda cada 0,05 grados: unos 5,5 km.
PASO = 0.05
ZOOM = 6


def tesela_x(lon, z):
    return (lon + 180) / 360 * 2 ** z


def tesela_y(lat, z):
    r = math.radians(lat)
    return (1 - math.asinh(math.tan(r)) / math.pi) / 2 * 2 ** z


def bajar(url, destino):
    if destino.exists():
        return destino.read_bytes()
    destino.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as r:
        datos = r.read()
    destino.write_bytes(datos)
    return datos


def relieve():
    x0, x1 = int(tesela_x(OESTE, ZOOM)), int(tesela_x(ESTE, ZOOM))
    y0, y1 = int(tesela_y(NORTE, ZOOM)), int(tesela_y(SUR, ZOOM))
    mosaico = Image.new('RGB', ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png'
            img = Image.open(io.BytesIO(bajar(url, CACHE / f'{ZOOM}-{x}-{y}.png'))).convert('RGB')
            mosaico.paste(img, ((x - x0) * 256, (y - y0) * 256))
    px = mosaico.load()
    w, h = mosaico.size

    def altura(lon, lat):
        # Muestreo bilineal en el mosaico (proyección de Mercator de las teselas).
        gx = (tesela_x(lon, ZOOM) - x0) * 256 - 0.5
        gy = (tesela_y(lat, ZOOM) - y0) * 256 - 0.5
        ix, iy = int(math.floor(gx)), int(math.floor(gy))
        fx, fy = gx - ix, gy - iy

        def m(a, b):
            a = min(max(a, 0), w - 1)
            b = min(max(b, 0), h - 1)
            r, g, bl = px[a, b]
            return r * 256 + g + bl / 256 - 32768

        arriba = m(ix, iy) * (1 - fx) + m(ix + 1, iy) * fx
        abajo = m(ix, iy + 1) * (1 - fx) + m(ix + 1, iy + 1) * fx
        return arriba * (1 - fy) + abajo * fy

    ancho = round((ESTE - OESTE) / PASO) + 1
    alto = round((NORTE - SUR) / PASO) + 1
    valores = []
    for j in range(alto):
        lat = NORTE - j * PASO
        for i in range(ancho):
            lon = OESTE + i * PASO
            valores.append(max(-32768, min(32767, round(altura(lon, lat)))))
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / 'relieve.bin').write_bytes(struct.pack('<hh', ancho, alto) + struct.pack(f'<{len(valores)}h', *valores))
    print(f'relieve: {ancho} x {alto}, de {min(valores)} a {max(valores)} m, {len(valores) * 2 // 1024} KB')


def historicos():
    url = (
        'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time-asc'
        f'&starttime=1973-01-01&minmagnitude=4.5&minlatitude={SUR}&maxlatitude={NORTE}'
        f'&minlongitude={OESTE}&maxlongitude={ESTE}&limit=20000'
    )
    with urllib.request.urlopen(url, timeout=120) as r:
        datos = json.load(r)
    lista = []
    for f in datos['features']:
        lon, lat, prof = f['geometry']['coordinates']
        p = f['properties']
        if p.get('mag') is None:
            continue
        anio = int(p['time'] / 1000 / 31557600 + 1970)
        lista.append([round(lon, 3), round(lat, 3), round(prof or 0, 1), round(p['mag'], 1), anio])
    (SALIDA / 'historicos.json').write_text(json.dumps(lista, separators=(',', ':')), encoding='utf-8')
    hondos = sum(1 for s in lista if s[2] > 300)
    print(f'históricos: {len(lista)} sismos, {hondos} a más de 300 km')


if __name__ == '__main__':
    relieve()
    historicos()
