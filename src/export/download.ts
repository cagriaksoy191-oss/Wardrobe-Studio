export function downloadFile(name:string,data:BlobPart,type:string) {
  const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function safeFileName(value:string){return value.normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').slice(0,80)||'wardrobe';}
