import {
  useEffect,
  useMemo,
  useState } from 'react';
import { collection,
  doc,
  getDocs
} from 'firebase/firestore';
import { Briefcase, Check, Film, Images, Link2, Loader2, Save, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import type { CaseStudy } from '../../types';
import { versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from '../../lib/cmsVersioning';

import {
  isPhotoGallery,
  sortGalleries,
  type PhotoGallery,
} from '../../lib/galleryContent';
import {
  isVideoProject,
  sortVideoProjects,
  type VideoProject,
} from '../../lib/videoPortfolio';
import {
  PROJECT_RELATION_COLLECTION,
  PROJECT_RELATION_KIND,
  isProjectRelation,
  relationDocumentId,
  type ProjectRelation,
} from '../../lib/projectRelations';

interface EditState {
  caseId: string;
  galleryIds: string[];
  videoProjectIds: string[];
}

export function RelationsManager() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [relations, setRelations] = useState<ProjectRelation[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [caseSnapshot, settingsSnapshot] = await Promise.all([
        getDocs(collection(db, 'cases')),
        getDocs(collection(db, 'site_settings')),
      ]);
      const caseDocs = caseSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
      const settingsDocs = settingsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setCases(caseDocs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setGalleries(sortGalleries(settingsDocs.filter(isPhotoGallery)));
      setVideos(sortVideoProjects(settingsDocs.filter(isVideoProject)));
      setRelations(settingsDocs.filter(isProjectRelation));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const relationByCase = useMemo(() => new Map(relations.map(item => [item.caseId, item])), [relations]);

  const caseTitle = (item: CaseStudy) => item.title_uk || item.title || item.title_en || item.id;
  const galleryTitle = (item: PhotoGallery) => item.title_uk || item.title || item.title_en || item.id;
  const videoTitle = (item: VideoProject) => item.title_uk || item.title || item.title_en || item.id;

  const beginEdit = (caseId: string) => {
    const current = relationByCase.get(caseId);
    setEditing({
      caseId,
      galleryIds: [...(current?.galleryIds || [])],
      videoProjectIds: [...(current?.videoProjectIds || [])],
    });
    setError('');
  };

  const toggle = (field: 'galleryIds' | 'videoProjectIds', id: string) => {
    if (!editing) return;
    const selected = new Set(editing[field]);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    setEditing({ ...editing, [field]: Array.from(selected) });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const id = relationDocumentId(editing.caseId);
      if (editing.galleryIds.length === 0 && editing.videoProjectIds.length === 0) {
        await deleteDoc(doc(db, PROJECT_RELATION_COLLECTION, id));
      } else {
        const payload: ProjectRelation = {
          id,
          kind: PROJECT_RELATION_KIND,
          caseId: editing.caseId,
          galleryIds: editing.galleryIds,
          videoProjectIds: editing.videoProjectIds,
          updatedAt: Date.now(),
        };
        await setDoc(doc(db, PROJECT_RELATION_COLLECTION, id), payload);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-violet-700">
          <Link2 className="h-3.5 w-3.5" /> Portfolio relations
        </div>
        <h2 className="mt-3 text-2xl font-black text-slate-950">Связи кейсов, фото и видео</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
          Один кейс может быть связан с несколькими фотогалереями и видеопроектами. На публичных страницах связанные материалы появятся автоматически и будут ссылаться друг на друга.
        </p>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">Загрузка связей…</div>
      ) : cases.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">Сначала создайте хотя бы один кейс.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cases.map(item => {
            const relation = relationByCase.get(item.id);
            return (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-600"><Briefcase className="h-3.5 w-3.5" />Кейс</div>
                    <h3 className="mt-1 truncate text-lg font-black text-slate-950">{caseTitle(item)}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.client || item.category}</p>
                  </div>
                  <button type="button" onClick={() => beginEdit(item.id)} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500">Связать</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-50 px-2.5 py-1.5 text-fuchsia-700"><Images className="h-3.5 w-3.5" />{relation?.galleryIds.length || 0} галерей</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-indigo-700"><Film className="h-3.5 w-3.5" />{relation?.videoProjectIds.length || 0} видео</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-7">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Связи проекта</div>
                <h3 className="mt-1 text-xl font-black text-slate-950">{caseTitle(cases.find(item => item.id === editing.caseId) || cases[0])}</h3>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-2">
              <section>
                <div className="mb-3 flex items-center gap-2"><Images className="h-4 w-4 text-fuchsia-600" /><h4 className="text-sm font-black text-slate-900">Фотогалереи</h4></div>
                <div className="space-y-2">
                  {galleries.length ? galleries.map(item => {
                    const active = editing.galleryIds.includes(item.id);
                    return (
                      <button key={item.id} type="button" onClick={() => toggle('galleryIds', item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-fuchsia-300 bg-fuchsia-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${active ? 'border-fuchsia-600 bg-fuchsia-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{galleryTitle(item)}</span><span className="text-[11px] text-slate-500">{item.published === false ? 'Черновик' : `${item.images.length} фото`}</span></span>
                      </button>
                    );
                  }) : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Галерей пока нет.</div>}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2"><Film className="h-4 w-4 text-indigo-600" /><h4 className="text-sm font-black text-slate-900">Видеопроекты</h4></div>
                <div className="space-y-2">
                  {videos.length ? videos.map(item => {
                    const active = editing.videoProjectIds.includes(item.id);
                    return (
                      <button key={item.id} type="button" onClick={() => toggle('videoProjectIds', item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{videoTitle(item)}</span><span className="text-[11px] text-slate-500">{item.published === false ? 'Черновик' : `${item.videos.length} видео`}</span></span>
                      </button>
                    );
                  }) : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Видеопроектов пока нет.</div>}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-7">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Отмена</button>
              <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Сохранить связи</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
