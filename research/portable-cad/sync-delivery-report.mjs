import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const plan=JSON.parse(await readFile('artifacts/portable-cad/delivery-plan.json','utf8'));
const manifest=JSON.parse(await readFile(resolve(plan.delivery,'DELIVERY_SHA256.json'),'utf8'));
const get=name=>manifest.files.find(f=>f.name===name),file='CAD_GALLERY_PORTABILITY_VERIFICATION.md';
let md=await readFile(file,'utf8');
for(const name of ['D3_CAD_GALLERY_PORTABLE.zip','B3_CAD_GALLERY_PORTABLE.zip','D3_CAD_COMPARISON_ATLAS.pdf','B3_ENGINEERING_COMPARISON_ATLAS.pdf']) {
 const m=get(name);if(!m)throw Error('Missing delivery '+name);
 md=md.replace(new RegExp('(^\\| '+name.replaceAll('.','\\.')+' \\|)\\d+(\\|)','m'),`$1${m.bytes}$2`);
}
for(const [label,names]of [['ZIP',['D3_CAD_GALLERY_PORTABLE.zip','B3_CAD_GALLERY_PORTABLE.zip']],['PDF',['D3_CAD_COMPARISON_ATLAS.pdf','B3_ENGINEERING_COMPARISON_ATLAS.pdf']]])
 md=md.replace(new RegExp('^'+label+' SHA-256:.*$','m'),`${label} SHA-256: D3\`${get(names[0]).sha256}\`; B3\`${get(names[1]).sha256}\`.`);
await writeFile(file,md);console.log('Synced exact final delivery sizes and SHA-256 into tracked report');
