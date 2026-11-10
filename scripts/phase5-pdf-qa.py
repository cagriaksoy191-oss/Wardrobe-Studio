import json, subprocess
from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw

root=Path.cwd(); dest=root/'tmp/pdfs';dest.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'artifacts/phase5/examples/manifest.json').read_text(encoding='utf-8'))
summary=[]
for record in manifest:
    path=root/record['path'];reader=PdfReader(path)
    assert len(reader.pages)==record['pages']
    texts=[p.extract_text() for p in reader.pages];all_text='\n'.join(texts)
    assert all(len(t)>80 for t in texts)
    assert 'Çekmece' in all_text and 'USTA KONTROLÜ' in all_text
    production=json.loads((root/f"artifacts/phase5/examples/{record['kind']}/production.json").read_text(encoding='utf-8'))
    assert all(p['code'] in all_text for p in production['parts'])
    assert 'Üretim ve montaj notu 8' in all_text
    if record['polygons']:
        assert 'V5' in all_text and 'Köşe iç açısı' in all_text
    prefix=dest/record['kind'];subprocess.run(['pdftoppm','-scale-to','1400','-png',str(path),str(prefix)],check=True,capture_output=True)
    pages=sorted(dest.glob(record['kind']+'-*.png'))
    for start in range(0,len(pages),12):
        contact=Image.new('RGB',(1920,4*370),'#d5dde2');draw=ImageDraw.Draw(contact)
        for i,page in enumerate(pages[start:start+12]):
            im=Image.open(page).convert('RGB');im.thumbnail((630,337));x=(i%3)*640+(640-im.width)//2;y=(i//3)*370+23
            contact.paste(im,(x,y));draw.text(((i%3)*640+12,(i//3)*370+5),f"{record['kind']} / {start+i+1}: {record['sheets'][start+i]['id']}",fill='black')
        contact.save(dest/f"contact-{record['kind']}-{start//12+1}.png")
    summary.append({'kind':record['kind'],'pages':len(pages),'turkishText':True,'allPartCodes':True,'completeNotes':True,'pageSizePt':[float(reader.pages[0].mediabox.width),float(reader.pages[0].mediabox.height)]})
(root/'artifacts/phase5/pdf-qa.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
