import json
from pathlib import Path
import pdfplumber
from PIL import Image,ImageOps,ImageDraw

plan=json.loads(Path('artifacts/portable-cad/delivery-plan.json').read_text(encoding='utf-8'))
evidence=Path('artifacts/portable-cad')
issues=[]
stats=[]
for group in ['D3','B3']:
    name='D3_CAD_COMPARISON_ATLAS.pdf' if group=='D3' else 'B3_ENGINEERING_COMPARISON_ATLAS.pdf'
    with pdfplumber.open(Path(plan['delivery'])/name) as pdf:
        for i,p in enumerate(pdf.pages):
            chars=p.chars
            out=[c for c in chars if c['x0'] < -0.5 or c['x1']>1200.5 or c['top']<-.5 or c['bottom']>840.5]
            if out:issues.append({'pdf':name,'page':i+1,'outOfBoundsText':''.join(c['text'] for c in out)})
            assert all('Noto' in c['fontname'] for c in chars), (name,i,'font fallback')
            assert 'FİZİKSEL ÜRETİM ONAYI YOK' in p.extract_text()
        stats.append({'name':name,'pages':len(pdf.pages),'allTextWithinPage':not any(x['pdf']==name for x in issues),'allFontsEmbeddedNoto':True})
    pngs=sorted((evidence/(group.lower()+'-render')).glob('page-*.png'))
    assert len(pngs)==stats[-1]['pages'], (group,len(pngs))
    for chunk in range(0,len(pngs),6):
        sheet=Image.new('RGB',(1240,1390),'#d8e1e8')
        d=ImageDraw.Draw(sheet)
        for j,p in enumerate(pngs[chunk:chunk+6]):
            with Image.open(p) as im:thumb=ImageOps.contain(im,(600,420))
            x=20+(j%2)*620;y=25+(j//2)*460
            sheet.paste(thumb,(x,y+20));d.text((x,y),p.stem,fill='#172554')
        sheet.save(evidence/f'{group.lower()}-contact-{chunk//6+1}.png')
Path(evidence/'pdf-layout-verification.json').write_text(json.dumps({'stats':stats,'issues':issues},indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'stats':stats,'issues':issues},ensure_ascii=False))
if issues:raise SystemExit(1)
