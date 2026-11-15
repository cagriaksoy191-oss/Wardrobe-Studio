"""Vector PDF atlas from the same deterministic primitives used by SVG views.
No SVG rasterization, CDN, renderer installation or application source changes.
Run with the bundled Python containing reportlab/pypdf/Pillow.
"""
import json
import sys
import base64
from io import BytesIO
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader

plan = json.loads(Path(sys.argv[1] if len(sys.argv)>1 else 'artifacts/portable-cad/delivery-plan.json').read_text(encoding='utf-8'))
pdfmetrics.registerFont(TTFont('Noto', plan['font']))
out = Path(plan['delivery'])
evidence = Path('artifacts/portable-cad')
results = []
for group in plan['groups']:
    record = json.loads(Path(group['pageFile']).read_text(encoding='utf-8'))
    name = 'D3_CAD_COMPARISON_ATLAS.pdf' if group['name']=='D3' else 'B3_ENGINEERING_COMPARISON_ATLAS.pdf'
    dest = out/name
    # PDF points are chosen close to A3 landscape; one primitive unit is one point.
    pdf = canvas.Canvas(str(dest), pagesize=(1200,840), invariant=1, pageCompression=1)
    pdf.setTitle(group['name']+' - Deneysel CAD inceleme atlası')
    pdf.setAuthor('Wardrobe Studio - research only')
    for page_index,page in enumerate(record['pages']):
        pdf.bookmarkPage(str(page_index))
        pdf.addOutlineEntry(page['id']+' / '+page['label'],str(page_index),level=0,closed=False)
        for obj in page['commands']:
            if obj['type']=='text':
                pdf.setFillColor(HexColor(obj['color']))
                pdf.setFont('Noto',obj['size'])
                pdf.drawString(obj['x'],840-obj['y'],obj['text'])
            elif obj['type']=='image':
                pdf.drawImage(ImageReader(BytesIO(base64.b64decode(obj['data']))),obj['x'],840-obj['y']-obj['h'],width=obj['w'],height=obj['h'])
            elif obj['type']=='line':
                pdf.setStrokeColor(HexColor(obj['color']))
                pdf.setLineWidth(obj['width'])
                pdf.line(obj['a'][0],840-obj['a'][1],obj['b'][0],840-obj['b'][1])
            else:
                pdf.saveState()
                fill=obj.get('fill','none')
                stroke=obj.get('stroke','none')
                alpha=obj.get('opacity',1)
                pdf.setFillAlpha(alpha)
                pdf.setStrokeAlpha(alpha)
                if fill!='none': pdf.setFillColor(HexColor(fill))
                if stroke!='none': pdf.setStrokeColor(HexColor(stroke))
                pdf.setLineWidth(obj.get('width',.6))
                path=pdf.beginPath()
                for index,(x,y) in enumerate(obj['points']):
                    if index==0:path.moveTo(x,840-y)
                    else:path.lineTo(x,840-y)
                path.close()
                pdf.drawPath(path,stroke=int(stroke!='none'),fill=int(fill!='none'))
                pdf.restoreState()
        pdf.setFont('Noto',9)
        pdf.setFillColor(HexColor('#18334b'))
        pdf.drawRightString(1164,24,f"{page_index+1} / {len(record['pages'])}")
        pdf.showPage()
    pdf.save()
    reader=PdfReader(str(dest))
    assert len(reader.pages)==len(record['pages'])
    for index,page in enumerate(reader.pages):
        text=page.extract_text()
        assert 'DENEYSEL CAD' in text and 'FİZİKSEL ÜRETİM ONAYI YOK' in text, (name,index,'watermark')
    results.append({'file':str(dest),'pages':len(reader.pages),'bytes':dest.stat().st_size,'pageIds':[p['id'] for p in record['pages']]})
evidence.mkdir(parents=True,exist_ok=True)
(evidence/'pdf-structure-verification.json').write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False))
