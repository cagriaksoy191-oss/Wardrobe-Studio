"""High resolution selected previews, rendered from the final PDF pages."""
import json
import subprocess
from pathlib import Path
plan=json.loads(Path('artifacts/portable-cad/delivery-plan.json').read_text(encoding='utf-8'))
out=Path(plan['delivery'])/'previews'
for group,pages in [('D3',[(1,'D3_OVERVIEW'),(2,'D3_SELECTED_002_70_HANGING'),(9,'D3_001_70_SHELF'),(25,'D3_002_70_SHELF')]),('B3',[(1,'B3_OVERVIEW'),(4,'B3_SINGLE3'),(6,'B3_DUAL3'),(8,'B3_DUAL2')])]:
    pdf=Path(plan['delivery'])/('D3_CAD_COMPARISON_ATLAS.pdf' if group=='D3' else 'B3_ENGINEERING_COMPARISON_ATLAS.pdf')
    for page,name in pages:
        subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-singlefile','-r','150','-png',str(pdf),str(out/name)],check=True)
print('Eight final 2500px PNG previews rendered')
