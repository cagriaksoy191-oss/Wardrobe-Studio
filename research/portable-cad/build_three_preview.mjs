import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('artifacts/portable-cad/three-preview');await mkdir(out,{recursive:true});
const scenes=await readFile('artifacts/portable-cad/render-scenes.json','utf8');
const result=await build({stdin:{resolveDir:process.cwd(),loader:'js',contents:`
import * as THREE from 'three';
const scenes=${scenes};
const select=document.getElementById('scene');
for(const scene of scenes){const o=document.createElement('option');o.value=o.textContent=scene.id;select.append(o);}
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(2400,1520);renderer.setClearColor('#ffffff');renderer.outputColorSpace=THREE.SRGBColorSpace;
document.getElementById('canvas').append(renderer.domElement);
const world=new THREE.Scene();world.add(new THREE.AmbientLight(0xffffff,2.2));
const light=new THREE.DirectionalLight(0xffffff,2.7);light.position.set(6,8,5);world.add(light);
const light2=new THREE.DirectionalLight(0xffffff,.8);light2.position.set(-5,4,3);world.add(light2);
const objects=[];let materials=[];
function show(){
 for(const o of objects){world.remove(o);o.geometry.dispose();}objects.length=0;for(const m of materials)m.dispose();materials=[];
 const data=scenes.find(s=>s.id===select.value);const bounds=new THREE.Box3();
 for(const v of data.volumes){
  if(v.y1-v.y0<.01||v.polygon.length<3)continue;
  const shape=new THREE.Shape();v.polygon.forEach((p,i)=>{if(i)shape.lineTo(p.xMm/1000,p.zMm/1000);else shape.moveTo(p.xMm/1000,p.zMm/1000);});shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:(v.y1-v.y0)/1000,bevelEnabled:false,steps:1});
  const a=geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getY(i),y=a.getZ(i)+v.y0/1000;a.setXYZ(i,x,y,z);}geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:v.fill??'#d8c8a9',roughness:1,metalness:0,side:THREE.DoubleSide});materials.push(material);
  const mesh=new THREE.Mesh(geometry,material);world.add(mesh);objects.push(mesh);bounds.expandByObject(mesh);
  const edgeMaterial=new THREE.LineBasicMaterial({color:'#5c6b79',transparent:true,opacity:.6});materials.push(edgeMaterial);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),edgeMaterial);world.add(edge);objects.push(edge);
 }
 const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 const camera=new THREE.OrthographicCamera(-3,3,1.9,-1.9,.01,100);camera.position.copy(center).add(new THREE.Vector3(7,5.5,7));camera.lookAt(center);camera.updateMatrixWorld();
 const inverse=camera.matrixWorldInverse,points=[];for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z])points.push(new THREE.Vector3(x,y,z).applyMatrix4(inverse));
 const loX=Math.min(...points.map(p=>p.x)),hiX=Math.max(...points.map(p=>p.x)),loY=Math.min(...points.map(p=>p.y)),hiY=Math.max(...points.map(p=>p.y));
 const h=Math.max(hiY-loY,(hiX-loX)*1520/2400)*1.12,w=h*2400/1520;
 camera.left=(loX+hiX)/2-w/2;camera.right=camera.left+w;camera.bottom=(loY+hiY)/2-h/2;camera.top=camera.bottom+h;camera.updateProjectionMatrix();
 renderer.render(world,camera);document.getElementById('ready').textContent='READY '+data.id;document.body.dataset.scene=data.id;
}
select.onchange=show;show();
`},bundle:true,platform:'browser',format:'iife',write:false});
await writeFile(resolve(out,'renderer.js'),result.outputFiles[0].contents);
await writeFile(resolve(out,'index.html'),`<!doctype html><html lang="tr"><meta charset="utf-8"><title>Deneysel CAD - Three.js derinlik doğrulaması</title><style>body{margin:0;background:white;font:18px Arial}header{height:70px;box-sizing:border-box;padding:10px}select{font:16px Arial;max-width:70vw}#canvas,canvas{width:2400px;height:1520px;display:block}</style><header><label>Render sahnesi <select id="scene" aria-label="Render sahnesi"></select></label><span id="ready" role="status"></span></header><div id="canvas"></div><script src="renderer.js"></script></html>`);
console.log(out);
