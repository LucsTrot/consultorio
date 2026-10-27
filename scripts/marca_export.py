# Rasteriza los SVG del kit de marca (carpeta brand/) a PNG en base64 para el PDF y el Word.
# Uso: python3 scripts/marca_export.py   (requiere playwright)
import base64, pathlib
from playwright.sync_api import sync_playwright

raiz = pathlib.Path(__file__).resolve().parent.parent
piezas = {
    # nombre: (archivo, ancho en px)
    'isotipoInverso': ('brand/isotipo-inverso.svg', 320),
    'lockupHorizontal': ('brand/lockup-horizontal-principal.svg', 1400),
    'filigrana': ('brand/filigrana-verde.svg', 900),
}
salida = ['// Generado por scripts/marca_export.py — no editar a mano.',
          '// PNG con fondo transparente, rasterizados de los SVG oficiales del kit de marca.',
          'export const MARCA = {']
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    for nombre, (archivo, ancho) in piezas.items():
        svg = (raiz / archivo).read_text()
        pg.set_content(f"<body style='margin:0;background:transparent'><img id=i style='width:{ancho}px;display:block' src='data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}'></body>")
        pg.wait_for_timeout(150)
        el = pg.locator('#i')
        png = el.screenshot(omit_background=True)
        box = el.bounding_box()
        salida.append(f"  {nombre}: {{ ancho: {round(box['width'])}, alto: {round(box['height'])}, dataUrl: 'data:image/png;base64,{base64.b64encode(png).decode()}' }},")
    b.close()
salida.append('};')
(raiz / 'src/lib/export/marcaImagenes.ts').write_text('\n'.join(salida) + '\n')
print('ok')
