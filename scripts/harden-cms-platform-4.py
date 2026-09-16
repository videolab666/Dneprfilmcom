from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# Scheduled publishing must freeze a snapshot, not keep following mutable draft.
p = ROOT / 'src/lib/fullPageEditing.ts'
s = p.read_text(encoding='utf-8')
s = s.replace("  version: 4;\n  draft: FullPageCmsContent;\n  workflow: FullPageCmsWorkflow;", "  version: 4;\n  draft: FullPageCmsContent;\n  scheduled?: FullPageCmsContent;\n  workflow: FullPageCmsWorkflow;")
s = s.replace("  const workflow = source.version === 4 && source.workflow && typeof source.workflow === 'object' ? source.workflow : {};\n  return { version: 4, ...published, draft, workflow };", "  const workflow = source.version === 4 && source.workflow && typeof source.workflow === 'object' ? source.workflow : {};\n  const scheduled = source.version === 4 && source.scheduled ? normalizeContent(source.scheduled) : undefined;\n  return { version: 4, ...published, draft, scheduled, workflow };")
s = s.replace("  const scheduled = typeof config.workflow.scheduledAt === 'number' && config.workflow.scheduledAt > 0 && config.workflow.scheduledAt <= now;\n  if (!options?.preview && !scheduled) return config;\n  return { ...config, ...clone(config.draft) };", "  const scheduledDue = typeof config.workflow.scheduledAt === 'number' && config.workflow.scheduledAt > 0 && config.workflow.scheduledAt <= now;\n  if (options?.preview) return { ...config, ...clone(config.draft) };\n  if (scheduledDue) return { ...config, ...clone(config.scheduled || config.draft) };\n  return config;")
s = s.replace("    ...clone(config.draft),\n    workflow:", "    ...clone(config.draft),\n    scheduled: undefined,\n    workflow:", 1)
s = s.replace("    workflow: { ...config.workflow, draftUpdatedAt: Date.now(), scheduledAt: null },", "    workflow: { ...config.workflow, draftUpdatedAt: Date.now() },")
p.write_text(s, encoding='utf-8')

# Manager stores frozen scheduled content.
p = ROOT / 'src/components/admin/FullPageEditingManagerV4.tsx'
s = p.read_text(encoding='utf-8')
old = "    const next = replaceFullPageDraft(config, config.draft, actor);\n    next.workflow.scheduledAt = Number.isFinite(at) ? at : null;\n    await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage(at ? `Публикация запланирована на ${new Date(at).toLocaleString()}.` : 'Расписание очищено.');"
new = "    const next = replaceFullPageDraft(config, config.draft, actor);\n    next.workflow.scheduledAt = Number.isFinite(at) ? at : null;\n    next.scheduled = Number.isFinite(at) ? clone(config.draft) : undefined;\n    await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage(at ? `Публикация запланирована на ${new Date(at).toLocaleString()}; зафиксирован отдельный snapshot.` : 'Расписание очищено.');"
s = s.replace(old, new)
s = s.replace("После указанного времени public runtime автоматически начнёт использовать текущий Draft. Для SEO-prerender", "После указанного времени public runtime автоматически начнёт использовать зафиксированный snapshot Draft. Последующие правки черновика его не изменят. Для SEO-prerender")
p.write_text(s, encoding='utf-8')

# Retention without composite Firestore index.
p = ROOT / 'src/lib/cmsVersioning.ts'
s = p.read_text(encoding='utf-8')
old = "    const old = await getDocs(query(collection(db, 'content_versions'), where('targetPath', '==', ref.path), orderBy('createdAt', 'desc'), limit(36)));\n    if (old.docs.length > 30) await Promise.all(old.docs.slice(30).map(item => firestoreDeleteDoc(item.ref)));"
new = "    const old = await getDocs(query(collection(db, 'content_versions'), where('targetPath', '==', ref.path)));\n    const sorted = [...old.docs].sort((a, b) => Number(b.data().createdAt || 0) - Number(a.data().createdAt || 0));\n    if (sorted.length > 30) await Promise.all(sorted.slice(30).map(item => firestoreDeleteDoc(item.ref)));"
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

# Media registry writes/deletes also need snapshots.
p = ROOT / 'src/lib/mediaLibrary.ts'
s = p.read_text(encoding='utf-8')
s = s.replace("import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';", "import { collection, doc, getDocs } from 'firebase/firestore';")
if "cmsVersioning" not in s:
    s = s.replace("import { db } from './firebase';", "import { db } from './firebase';\nimport { versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from './cmsVersioning';")
p.write_text(s, encoding='utf-8')

# Relation helper: direct writes are versioned and batch operations are snapshotted before commit.
p = ROOT / 'src/lib/portfolioRelationsAdmin.ts'
s = p.read_text(encoding='utf-8')
s = s.replace("import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';", "import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';")
if "cmsVersioning" not in s:
    s = s.replace("import { db } from './firebase';", "import { db } from './firebase';\nimport { snapshotDocument, versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from './cmsVersioning';")
# first batch in savePortfolioRelationSelection
s = s.replace("  const batch = writeBatch(db);\n  let changes = 0;\n\n  for (const caseId of allCaseIds)", "  const batch = writeBatch(db);\n  const snapshots: Promise<void>[] = [];\n  let changes = 0;\n\n  for (const caseId of allCaseIds)", 1)
s = s.replace("      batch.delete(relationRef);\n    } else {", "      snapshots.push(snapshotDocument(relationRef, 'batch-delete'));\n      batch.delete(relationRef);\n    } else {", 1)
s = s.replace("      batch.set(relationRef, payload);\n    }\n    changes += 1;", "      snapshots.push(snapshotDocument(relationRef, 'batch-set', payload));\n      batch.set(relationRef, payload);\n    }\n    changes += 1;", 1)
s = s.replace("  if (changes > 0) await batch.commit();\n}\n\nexport async function cleanupPortfolioRelations", "  if (changes > 0) { await Promise.all(snapshots); await batch.commit(); }\n}\n\nexport async function cleanupPortfolioRelations", 1)
# cleanup batch
marker = "  const batch = writeBatch(db);\n  let changes = 0;\n\n  if (entityType === 'case')"
s = s.replace(marker, "  const batch = writeBatch(db);\n  const snapshots: Promise<void>[] = [];\n  let changes = 0;\n\n  if (entityType === 'case')", 1)
s = s.replace("  if (entityType === 'case') {\n    batch.delete(doc(db, PROJECT_RELATION_COLLECTION, relationDocumentId(entityId)));", "  if (entityType === 'case') {\n    const relationRef = doc(db, PROJECT_RELATION_COLLECTION, relationDocumentId(entityId));\n    snapshots.push(snapshotDocument(relationRef, 'batch-delete'));\n    batch.delete(relationRef);", 1)
# second relation delete/set occurrences in cleanup
cleanup_pos = s.find("export async function cleanupPortfolioRelations")
head, tail = s[:cleanup_pos], s[cleanup_pos:]
tail = tail.replace("        batch.delete(relationRef);", "        snapshots.push(snapshotDocument(relationRef, 'batch-delete'));\n        batch.delete(relationRef);", 1)
tail = tail.replace("        batch.set(relationRef, {\n          ...relation,\n          galleryIds: nextGalleryIds,\n          videoProjectIds: nextVideoIds,\n          updatedAt: Date.now(),\n        });", "        const payload = { ...relation, galleryIds: nextGalleryIds, videoProjectIds: nextVideoIds, updatedAt: Date.now() };\n        snapshots.push(snapshotDocument(relationRef, 'batch-set', payload));\n        batch.set(relationRef, payload);", 1)
tail = tail.replace("    batch.update(article.ref, {\n      [articleField]: current.filter(id => id !== entityId),\n      updatedAt: Date.now(),\n    });", "    const payload = { [articleField]: current.filter(id => id !== entityId), updatedAt: Date.now() };\n    snapshots.push(snapshotDocument(article.ref, 'batch-update', payload));\n    batch.update(article.ref, payload);", 1)
tail = tail.replace("  if (changes > 0) await batch.commit();", "  if (changes > 0) { await Promise.all(snapshots); await batch.commit(); }")
s = head + tail
p.write_text(s, encoding='utf-8')

# Global search includes CRM leads as well.
p = ROOT / 'src/components/admin/AdminCommandCenter.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace("  if (collectionName === 'site_blocks') return 'blocks';", "  if (collectionName === 'site_blocks') return 'blocks';\n  if (collectionName === 'leads') return 'leads';")
s = s.replace("['cases', 'articles', 'site_blocks', 'site_settings', 'testimonials', 'backstage']", "['cases', 'articles', 'site_blocks', 'site_settings', 'testimonials', 'backstage', 'leads']")
s = s.replace("Поиск одновременно по кейсам, статьям, Page Builder, настройкам, галереям, видео, отзывам, backstage, всем Full Page текстам и Media Usage.", "Поиск одновременно по кейсам, статьям, Page Builder, настройкам, галереям, видео, отзывам, backstage, CRM-заявкам, всем Full Page текстам и Media Usage.")
p.write_text(s, encoding='utf-8')

print('CMS Platform 4.0 hardening applied.')
