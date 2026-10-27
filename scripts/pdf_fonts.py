# Convierte las fuentes de marca (woff de fontsource) a TTF base64 para jsPDF.
import base64, io, sys
from fontTools.ttLib import TTFont
base = 'node_modules/@fontsource'
fonts = {
  'Fraunces-Bold': f'{base}/fraunces/files/fraunces-latin-700-normal.woff',
  'Fraunces-SemiBoldItalic': f'{base}/fraunces/files/fraunces-latin-600-italic.woff',
  'Karla-Regular': f'{base}/karla/files/karla-latin-400-normal.woff',
  'Karla-Bold': f'{base}/karla/files/karla-latin-700-normal.woff',
  'DMMono-Regular': f'{base}/dm-mono/files/dm-mono-latin-400-normal.woff',
}
out = ['// Generado por scripts/pdf_fonts.py — no editar a mano.', 'export const PDF_FONTS: Record<string, string> = {']
for name, path in fonts.items():
    f = TTFont(path); f.flavor = None
    b = io.BytesIO(); f.save(b)
    out.append(f"  '{name}': '{base64.b64encode(b.getvalue()).decode()}',")
out.append('};')
open('src/lib/export/pdfFonts.ts','w').write('\n'.join(out)+'\n')
print('ok', sum(len(l) for l in out)//1024, 'KB')
