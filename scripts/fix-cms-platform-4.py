from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

manager_path = ROOT / 'src/components/admin/FullPageEditingManagerV4.tsx'
manager = manager_path.read_text(encoding='utf-8')
manager = manager.replace("import { useEffect, useMemo, useState } from 'react';", "import type { ReactNode } from 'react';\nimport { useEffect, useMemo, useState } from 'react';")
manager = manager.replace('icon: React.ReactNode', 'icon: ReactNode')
manager = manager.replace('numberField(key, value, next =>', 'numberField(key, Number(value), next =>')
manager = manager.replace('numberField(`type.${k}`,v,n=>', 'numberField(`type.${k}`,Number(v),n=>')
manager = manager.replace('numberField(`duration.${k}`,v,n=>', 'numberField(`duration.${k}`,Number(v),n=>')
manager = manager.replace('numberField(key,value,next=>', 'numberField(key,Number(value),next=>')
manager_path.write_text(manager, encoding='utf-8')

version_path = ROOT / 'src/lib/cmsVersioning.ts'
version = version_path.read_text(encoding='utf-8')
version = version.replace("  const parts = record.targetPath.split('/').filter(Boolean);\n  const ref = doc(db, ...parts) as DocumentReference<DocumentData>;", "  const ref = doc(db, record.targetPath) as DocumentReference<DocumentData>;")
version_path.write_text(version, encoding='utf-8')

print('CMS Platform 4.0 TypeScript fixes applied.')
