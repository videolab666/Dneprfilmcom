from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Portfolio Organizer: use versioned set writes instead of raw batch.
p = ROOT / 'src/components/admin/PortfolioOrganizer.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace("import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';", "import { collection, doc, getDocs } from 'firebase/firestore';")
if "cmsVersioning" not in s:
    s = s.replace("import { db } from '../../lib/firebase';", "import { db } from '../../lib/firebase';\nimport { versionedSetDoc as setDoc } from '../../lib/cmsVersioning';")
old = """      const batch = writeBatch(db);
      const now = Date.now();
      for (const item of items) {
        if (!dirtyKeys.has(item.key)) continue;
        const collectionName = item.type === 'case' ? 'cases' : 'site_settings';
        const orderField = item.type === 'case' ? { featuredOrder: item.order } : { order: item.order };
        batch.set(doc(db, collectionName, item.id), {
          ...orderField,
          published: item.published,
          taxonomy: item.taxonomy,
          updatedAt: now,
        }, { merge: true });
      }
      await batch.commit();"""
new = """      const now = Date.now();
      const writes = [];
      for (const item of items) {
        if (!dirtyKeys.has(item.key)) continue;
        const collectionName = item.type === 'case' ? 'cases' : 'site_settings';
        const orderField = item.type === 'case' ? { featuredOrder: item.order } : { order: item.order };
        writes.push(setDoc(doc(db, collectionName, item.id), {
          ...orderField,
          published: item.published,
          taxonomy: item.taxonomy,
          updatedAt: now,
        }, { merge: true }));
      }
      await Promise.all(writes);"""
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

# Unified Content bulk operations: use versioned update wrapper.
p = ROOT / 'src/components/admin/UnifiedContentManagerCore.tsx'
s = p.read_text(encoding='utf-8')
# Keep writeBatch import only if other use remains after replacements; add versioned update.
s = s.replace("import { versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from '../../lib/cmsVersioning';", "import { versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc, versionedUpdateDoc as updateDoc } from '../../lib/cmsVersioning';")
old = """      const batch = writeBatch(db);
      const now = Date.now();
      selectedItems.forEach(item => batch.update(doc(db, item.collectionName, item.id), { published, updatedAt: now }));
      await batch.commit();"""
new = """      const now = Date.now();
      await Promise.all(selectedItems.map(item => updateDoc(doc(db, item.collectionName, item.id), { published, updatedAt: now })));"""
s = s.replace(old, new)
old = """      const batch = writeBatch(db);
      const now = Date.now();
      selectedItems.forEach(item => {
        const taxonomy = taxonomyRecord(item.data);
        batch.update(doc(db, item.collectionName, item.id), { taxonomy: { ...taxonomy, category: bulkCategory }, updatedAt: now });
      });
      await batch.commit();"""
new = """      const now = Date.now();
      await Promise.all(selectedItems.map(item => {
        const taxonomy = taxonomyRecord(item.data);
        return updateDoc(doc(db, item.collectionName, item.id), { taxonomy: { ...taxonomy, category: bulkCategory }, updatedAt: now });
      }));"""
s = s.replace(old, new)
old = """      const batch = writeBatch(db);
      const now = Date.now();
      selectedItems.forEach(item => {
        const taxonomy = taxonomyRecord(item.data);
        const tags = Array.isArray(taxonomy.tags) ? taxonomy.tags.map(String).filter(Boolean) : [];
        batch.update(doc(db, item.collectionName, item.id), { taxonomy: { ...taxonomy, tags: Array.from(new Set<string>([...tags, tag])) }, updatedAt: now });
      });
      await batch.commit();"""
new = """      const now = Date.now();
      await Promise.all(selectedItems.map(item => {
        const taxonomy = taxonomyRecord(item.data);
        const tags = Array.isArray(taxonomy.tags) ? taxonomy.tags.map(String).filter(Boolean) : [];
        return updateDoc(doc(db, item.collectionName, item.id), { taxonomy: { ...taxonomy, tags: Array.from(new Set<string>([...tags, tag])) }, updatedAt: now });
      }));"""
s = s.replace(old, new)
s = s.replace("Удалить выбранные материалы (${selectedItems.length})? Это действие нельзя отменить.", "Удалить выбранные материалы (${selectedItems.length})? Перед удалением будет создана версия для восстановления через «История & Undo».")
# Remove writeBatch from firebase import if no actual writeBatch( remains.
if "writeBatch(" not in s:
    s = s.replace(",\n  writeBatch", "").replace("writeBatch,\n", "")
p.write_text(s, encoding='utf-8')

# Diagnostics fixes are user-triggered mutations and must be reversible.
p = ROOT / 'src/lib/cmsDiagnosticFixes.ts'
s = p.read_text(encoding='utf-8')
s = s.replace("import { doc, getDoc, updateDoc } from 'firebase/firestore';", "import { doc, getDoc } from 'firebase/firestore';")
if "cmsVersioning" not in s:
    s = s.replace("import { db } from './firebase';", "import { db } from './firebase';\nimport { versionedUpdateDoc as updateDoc } from './cmsVersioning';")
p.write_text(s, encoding='utf-8')

# SEO intelligence write-back must be reversible as well.
p = ROOT / 'src/lib/seoIntelligence.ts'
s = p.read_text(encoding='utf-8')
s = s.replace("import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';", "import { collection, doc, getDocs, query, where } from 'firebase/firestore';")
if "cmsVersioning" not in s:
    s = s.replace("import { db } from './firebase';", "import { db } from './firebase';\nimport { versionedSetDoc as setDoc } from './cmsVersioning';")
p.write_text(s, encoding='utf-8')

print('Daily admin versioning coverage completed.')
