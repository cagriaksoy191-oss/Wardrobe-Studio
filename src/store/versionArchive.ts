import {create} from 'zustand';
import {get as idbGet,set as idbSet} from 'idb-keyval';
import {normalizeAndValidateDesign} from '../core/schema/designSchema';
import type {Design} from '../core/schema/types';
export const VERSION_ARCHIVE_KEY='wardrobe-studio:named-versions:v1';
export interface NamedVersion {id:string;name:string;createdAt:string;updatedAt:string;archived:boolean;source:'manual'|'json';design:Design}
interface ArchiveData {schemaVersion:1;versions:NamedVersion[];recoveryDocuments?:string[]}
function readArchive(raw: unknown) {
  const versions: NamedVersion[] = [];
  const recoveryDocuments: string[] = [];
  if (raw == null) return { versions, recoveryDocuments };
  const archive = raw as Partial<ArchiveData>;
  if (archive.schemaVersion !== 1 || !Array.isArray(archive.versions)) {
    return { versions, recoveryDocuments: [JSON.stringify(raw)] };
  }
  if (Array.isArray(archive.recoveryDocuments)) {
    recoveryDocuments.push(...archive.recoveryDocuments.filter(value => typeof value === 'string'));
  }
  const seen = new Set<string>();
  for (const v of archive.versions) {
    try {
      if (versions.length >= 200 || typeof v?.id !== 'string' || !v.id || seen.has(v.id) ||
        typeof v.name !== 'string' || !v.name.trim() || !Number.isFinite(Date.parse(v.updatedAt)) ||
        !Number.isFinite(Date.parse(v.createdAt))) throw new Error('Geçersiz sürüm kaydı');
      const design = normalizeAndValidateDesign(v.design);
      seen.add(v.id);
      versions.push({ id: v.id, name: v.name.slice(0, 100), createdAt: v.createdAt, updatedAt: v.updatedAt,
        archived: Boolean(v.archived), source: v.source === 'json' ? 'json' : 'manual', design });
    } catch {
      recoveryDocuments.push(JSON.stringify(v) ?? 'null');
    }
  }
  return { versions, recoveryDocuments: [...new Set(recoveryDocuments)] };
}
export function parseVersionArchive(raw:unknown):NamedVersion[] {
  return readArchive(raw).versions;
}
function boot() {
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(VERSION_ARCHIVE_KEY) ?? null;
    return readArchive(JSON.parse(raw ?? 'null'));
  } catch {
    return { versions: [], recoveryDocuments: raw ? [raw] : [] };
  }
}
interface VersionArchive {
  versions:NamedVersion[];recoveryDocuments:string[];status:'idle'|'saving'|'saved'|'partial'|'restored'|'error';error:string|null;
  save:(name:string,design:Design,source?:'manual'|'json')=>string|null;
  rename:(id:string,name:string)=>void;setArchived:(id:string,archived:boolean)=>void;hydrate:()=>Promise<void>;
}
export const useVersionArchive=create<VersionArchive>((set,get)=>{
  let revision = 0;
  let writeQueue = Promise.resolve();
  const persist=(versions:NamedVersion[], recoveryDocuments = get().recoveryDocuments)=>{
    const pending = ++revision;
    set({ versions, recoveryDocuments, status: 'saving', error: null });
    const data: ArchiveData = { schemaVersion: 1, versions, ...(recoveryDocuments.length ? { recoveryDocuments } : {}) };
    let syncSaved = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VERSION_ARCHIVE_KEY, JSON.stringify(data));
        syncSaved = true;
      }
    } catch { /* IndexedDB ikinci kalıcı depodur. */ }
    const report = (indexedSaved: boolean) => {
      if (pending !== revision) return;
      set({
        status: syncSaved && indexedSaved ? 'saved' : syncSaved || indexedSaved ? 'partial' : 'error',
        error: syncSaved || indexedSaved ? null : 'Sürüm kalıcı olarak kaydedilemedi. JSON dışa aktarın.',
      });
    };
    if (typeof indexedDB === 'undefined') { report(false); return; }
    writeQueue = writeQueue.then(async () => {
      try { await idbSet(VERSION_ARCHIVE_KEY, data); report(true); }
      catch { report(false); }
    });
  };
  return {...boot(),status:'idle',error:null,
    save:(name,design,source='manual')=>{if(!name.trim()){set({error:'Sürüme bir ad verin.'});return null;}if(get().versions.length>=200){set({error:'Sürüm arşivi 200 kayıtla sınırlı. JSON dosyalarınızı dışa aktarın.'});return null;}
      let validated:Design;try{validated=normalizeAndValidateDesign(structuredClone(design));}catch(error){set({error:error instanceof Error ? error.message : 'Geçersiz tasarım sürüm olarak kaydedilemez.'});return null;}
      const now=new Date().toISOString(),id=`version-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      persist([...get().versions,{id,name:name.trim().slice(0,100),createdAt:now,updatedAt:now,source,archived:false,design:validated}]);return id;
    },
    rename:(id,name)=>{if(name.trim())persist(get().versions.map(v=>v.id===id?{...v,name:name.trim().slice(0,100),updatedAt:new Date().toISOString()}:v));},
    setArchived:(id,archived)=>persist(get().versions.map(v=>v.id===id?{...v,archived,updatedAt:new Date().toISOString()}:v)),
    hydrate: async () => {
      if (typeof indexedDB === 'undefined') return;
      const before = revision;
      try {
        const saved = readArchive(await idbGet(VERSION_ARCHIVE_KEY));
        const current = get();
        const recoveryDocuments = [...new Set([...current.recoveryDocuments, ...saved.recoveryDocuments])];
        const merged = new Map(current.versions.map(v => [v.id, v]));
        for (const version of saved.versions) {
          const old = merged.get(version.id);
          if (!old || (before === revision && version.updatedAt > old.updatedAt)) merged.set(version.id, version);
        }
        const versions = [...merged.values()].sort((a,b) => a.createdAt.localeCompare(b.createdAt));
        if (before !== revision) {
          if (versions.length !== current.versions.length || recoveryDocuments.length !== current.recoveryDocuments.length) {
            persist(versions, recoveryDocuments);
          }
          return;
        }
        if (versions.length || recoveryDocuments.length) {
          set({ versions, recoveryDocuments, status: 'restored', error: null });
        }
      } catch {
        set({ error: 'IndexedDB sürüm arşivi okunamadı. Yerel kopya korunuyor.' });
      }
    },
  };
});
