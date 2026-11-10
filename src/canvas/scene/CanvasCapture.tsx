import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {downloadFile,safeFileName} from '../../export/download';
import {useWardrobeStore} from '../../store/useWardrobeStore';

/** Geçici render ayarları aynı karede geri alınır; kamera ve tasarım durumu değiştirilmez. */
export function CanvasCapture() {
  const {gl,scene,camera}=useThree();
  useEffect(()=>{
    const capture=(event:Event)=>{
      const {kind,name}=((event as CustomEvent).detail??{}) as {kind?:'color'|'depth'|'edges';name?:string};if(!kind)return;
      const size=gl.getSize(new THREE.Vector2()),ratio=gl.getPixelRatio(),background=scene.background,override=scene.overrideMaterial,oldTone=gl.toneMapping;
      let material:THREE.Material|null=null;
      let renderCamera=camera;
      const hidden:THREE.Object3D[]=[];
      try {
        gl.setPixelRatio(Math.min(2,4096/Math.max(size.x,size.y)));
        if(kind==='depth'){
          material=new THREE.MeshDepthMaterial({depthPacking:THREE.BasicDepthPacking});
          if(camera instanceof THREE.PerspectiveCamera||camera instanceof THREE.OrthographicCamera){const copy=camera.clone(),bounds=new THREE.Box3();for(const p of useWardrobeStore.getState().resolved.panels){const c=new THREE.Vector3(...p.worldPositionMm).multiplyScalar(.001),half=new THREE.Vector3(...p.boxSizeMm).multiplyScalar(.0005);bounds.expandByPoint(c.clone().add(half));bounds.expandByPoint(c.clone().sub(half));}const sphere=bounds.getBoundingSphere(new THREE.Sphere()),distance=camera.position.distanceTo(sphere.center);copy.near=Math.max(.01,distance-sphere.radius*1.5);copy.far=Math.max(copy.near+.1,distance+sphere.radius*1.5);copy.updateProjectionMatrix();renderCamera=copy;}
        }
        if(kind==='edges')material=new THREE.MeshBasicMaterial({color:'#1b2936',wireframe:true});
        if(material)scene.traverse(object=>{
          const mesh=object as THREE.Mesh;
          if(!object.visible)return;
          const materials=mesh.material?(Array.isArray(mesh.material)?mesh.material:[mesh.material]):[];
          if(object.userData.studioHelper||(object as THREE.Line).isLine||materials.some(m=>m instanceof THREE.ShaderMaterial||(m.transparent&&m.opacity<.75&&!(m instanceof THREE.MeshPhysicalMaterial)))){object.visible=false;hidden.push(object);}
        });
        if(material){scene.overrideMaterial=material;scene.background=new THREE.Color('#ffffff');gl.toneMapping=THREE.NoToneMapping;}
        gl.render(scene,renderCamera);
        const data=gl.domElement.toDataURL('image/png');const binary=atob(data.split(',')[1]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        downloadFile(`${safeFileName(name??'wardrobe')}-${kind}.png`,bytes,'image/png');
        window.dispatchEvent(new CustomEvent('wardrobe:capture-ready',{detail:{kind,data,width:gl.domElement.width,height:gl.domElement.height}}));
      } finally {for(const object of hidden)object.visible=true;scene.overrideMaterial=override;scene.background=background;gl.toneMapping=oldTone;gl.setPixelRatio(ratio);gl.setSize(size.x,size.y,false);material?.dispose();gl.render(scene,camera);}
    };
    window.addEventListener('wardrobe:capture',capture);return()=>window.removeEventListener('wardrobe:capture',capture);
  },[gl,scene,camera]);return null;
}
