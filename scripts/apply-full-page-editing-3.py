from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def replace(path: str, old: str, new: str, count: int = 1):
    target = ROOT / path
    text = target.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Anchor not found in {path}: {old[:120]!r}')
    text = text.replace(old, new, count)
    target.write_text(text, encoding='utf-8')


# SiteSetting: keep the new CMS in the existing site_settings/global document.
replace(
    'src/types.ts',
    "  contactsPage?: ContactPageConfig;\n  updatedAt?: number;",
    "  contactsPage?: ContactPageConfig;\n  fullPageCms?: import('./lib/fullPageEditing').FullPageCmsConfig;\n  updatedAt?: number;",
)

# SiteContentContext: make the public translation helpers override-aware.
replace(
    'src/context/SiteContentContext.tsx',
    "import { legacyText, legacyValue, translateEnglishValue } from '../locales/legacyEnglish';",
    "import { legacyText, legacyValue, translateEnglishValue } from '../locales/legacyEnglish';\nimport { normalizeFullPageCms, resolveEditableCopy, resolveEditableLegacy, translationOverrideKey } from '../lib/fullPageEditing';",
)
replace(
    'src/context/SiteContentContext.tsx',
    "  const [loading, setLoading] = useState(true);\n",
    "  const [loading, setLoading] = useState(true);\n  const fullPageCms = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);\n",
)
replace(
    'src/context/SiteContentContext.tsx',
    "  const t = (key: string, fallback?: string): string => {\n    const activeDict = TRANSLATIONS[locale] || TRANSLATIONS.uk;",
    "  const t = (key: string, fallback?: string): string => {\n    const override = fullPageCms.copyOverrides[translationOverrideKey(key)]?.[locale];\n    if (typeof override === 'string') return override;\n    const activeDict = TRANSLATIONS[locale] || TRANSLATIONS.uk;",
)
replace(
    'src/context/SiteContentContext.tsx',
    "  const l = (uk: string, ru: string, en?: string): string => legacyText(locale, uk, ru, en);\n  const legacy = <T,>(uk: T, ru: T): T => legacyValue(locale, uk, ru);",
    "  const l = (uk: string, ru: string, en?: string): string => resolveEditableCopy(locale, uk, ru, en, fullPageCms.copyOverrides);\n  const legacy = <T,>(uk: T, ru: T): T => resolveEditableLegacy(locale, uk, ru, fullPageCms.copyOverrides);",
)

# Admin Dashboard tab.
replace(
    'src/pages/AdminDashboard.tsx',
    "const ContactsPageEditor = lazy(() => import('../components/admin/ContactsPageEditor').then(module => ({ default: module.ContactsPageEditor })));",
    "const ContactsPageEditor = lazy(() => import('../components/admin/ContactsPageEditor').then(module => ({ default: module.ContactsPageEditor })));\nconst FullPageEditingManager = lazy(() => import('../components/admin/FullPageEditingManager').then(module => ({ default: module.FullPageEditingManager })));",
)
replace(
    'src/pages/AdminDashboard.tsx',
    "type AdminTab = 'blocks' | 'contacts-page' | 'settings' | 'pages' | 'page-copy' | 'content' | 'organizer' | 'seo-quality' | 'relations' | 'media' | 'diagnostics' | 'testimonials' | 'backstage' | 'leads';",
    "type AdminTab = 'blocks' | 'contacts-page' | 'full-page' | 'settings' | 'pages' | 'page-copy' | 'content' | 'organizer' | 'seo-quality' | 'relations' | 'media' | 'diagnostics' | 'testimonials' | 'backstage' | 'leads';",
)
replace(
    'src/pages/AdminDashboard.tsx',
    "    { id: 'contacts-page', label: isUk ? 'Контакти' : 'Контакты', icon: <ContactRound className=\"w-4 h-4\" />, badge: '2.0' },\n",
    "    { id: 'contacts-page', label: isUk ? 'Контакти' : 'Контакты', icon: <ContactRound className=\"w-4 h-4\" />, badge: '2.0' },\n    { id: 'full-page', label: isUk ? 'Повне редагування' : 'Полное редактирование', icon: <FileText className=\"w-4 h-4\" />, badge: '3.0' },\n",
)
replace(
    'src/pages/AdminDashboard.tsx',
    "          {activeTab === 'contacts-page' && <ContactsPageEditor />}\n",
    "          {activeTab === 'contacts-page' && <ContactsPageEditor />}\n          {activeTab === 'full-page' && <FullPageEditingManager />}\n",
)

# Package scripts: catalog is regenerated before dev, typecheck and production build.
package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
package['scripts']['cms:catalog'] = 'bun scripts/generate-editable-copy-catalog.ts'
package['scripts']['dev'] = 'bun run cms:catalog && vite --port=3000 --host=0.0.0.0'
package['scripts']['build'] = 'bun run cms:catalog && vite build && bun scripts/audit-bundle-budget.ts'
package['scripts']['lint'] = 'bun run cms:catalog && tsc --noEmit'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Generator compatibility: array elements are already expressions in TypeScript AST.
replace(
    'scripts/generate-editable-copy-catalog.ts',
    "      if (ts.isExpression(a) && ts.isExpression(b)) collectLegacyPair(a, b, sourceFile, anchor, depth + 1);",
    "      collectLegacyPair(a, b, sourceFile, anchor, depth + 1);",
)

# LIVE calculator uses CMS pricing.
replace(
    'src/pages/LiveProduction.tsx',
    "import { useSiteContent } from '../context/SiteContentContext';",
    "import { useSiteContent } from '../context/SiteContentContext';\nimport { normalizeFullPageCms } from '../lib/fullPageEditing';",
)
replace(
    'src/pages/LiveProduction.tsx',
    "  const { isUk, isEn, l, legacy } = useSiteContent();\n",
    "  const { isUk, isEn, l, legacy, rawSettings } = useSiteContent();\n  const pricing = normalizeFullPageCms(rawSettings.fullPageCms).calculators.live;\n",
)
replace(
    'src/pages/LiveProduction.tsx',
    "  const calculateEstimate = () => {\n    let base = 12000; // Base station, director, streaming hardware\n    base += cameraCount * 4500; // Each camera + operator + wireless/SDI link\n    if (hasStarlink) base += 5000;\n    if (needGraphics) base += 3500;\n    if (needReplay) base += 4500;\n    if (needTranslation) base += 4000;\n    if (needLedOutput) base += 3000;\n    if (format === 'sports') base += 3000;\n    return base;\n  };",
    "  const calculateEstimate = () => {\n    let base = pricing.base;\n    base += cameraCount * pricing.camera;\n    if (hasStarlink) base += pricing.starlink;\n    if (needGraphics) base += pricing.graphics;\n    if (needReplay) base += pricing.replay;\n    if (needTranslation) base += pricing.translation;\n    if (needLedOutput) base += pricing.led;\n    if (format === 'sports') base += pricing.sports;\n    return base;\n  };",
)

# Video calculator uses CMS pricing.
replace(
    'src/pages/VideoProduction.tsx',
    "import { usePageCopyContent } from '../hooks/usePageCopyContent';",
    "import { usePageCopyContent } from '../hooks/usePageCopyContent';\nimport { normalizeFullPageCms } from '../lib/fullPageEditing';",
)
replace(
    'src/pages/VideoProduction.tsx',
    "  const { isUk, l, legacy } = useSiteContent();\n",
    "  const { isUk, l, legacy, rawSettings } = useSiteContent();\n  const pricing = normalizeFullPageCms(rawSettings.fullPageCms).calculators.video;\n",
)
replace(
    'src/pages/VideoProduction.tsx',
    "  const calculateEstimate = () => {\n    let base = 15000; // Basic filming day + editing\n\n    if (videoType === 'commercial') base += 10000;\n    if (videoType === 'factory') base += 12000;\n    if (videoType === 'corporate') base += 14000;\n    if (videoType === 'event') base += 5000;\n\n    if (duration === '60s') base += 3000;\n    if (duration === '2m') base += 7000;\n    if (duration === '5m+') base += 15000;\n\n    if (needScript) base += 4000;\n    if (needActors) base += 8000;\n    if (needDrone) base += 4500;\n    if (needVoiceover) base += 3000;\n    if (needGraphics3D) base += 9000;\n\n    return base;\n  };",
    "  const calculateEstimate = () => {\n    let base = pricing.base;\n    base += pricing.videoType[videoType];\n    base += pricing.duration[duration];\n    if (needScript) base += pricing.script;\n    if (needActors) base += pricing.actors;\n    if (needDrone) base += pricing.drone;\n    if (needVoiceover) base += pricing.voiceover;\n    if (needGraphics3D) base += pricing.graphics3d;\n    return base;\n  };",
)

# Construction calculator uses CMS pricing.
replace(
    'src/pages/ConstructionMedia.tsx',
    "import { usePageCopyContent } from '../hooks/usePageCopyContent';",
    "import { usePageCopyContent } from '../hooks/usePageCopyContent';\nimport { normalizeFullPageCms } from '../lib/fullPageEditing';",
)
replace(
    'src/pages/ConstructionMedia.tsx',
    "  const { isUk, settings, l } = useSiteContent();\n",
    "  const { isUk, settings, l, rawSettings } = useSiteContent();\n  const pricing = normalizeFullPageCms(rawSettings.fullPageCms).calculators.construction;\n",
)
replace(
    'src/pages/ConstructionMedia.tsx',
    "  const calculateEstimate = () => {\n    let monthlyBase = 0;\n\n    // Base camera maintenance & cloud archive\n    monthlyBase += timelapseCameras * 4500; // 4,500 грн/мес за точку таймлапса\n\n    // Drone flight frequency\n    if (droneFrequency === 'monthly') monthlyBase += 6000;\n    if (droneFrequency === 'biweekly') monthlyBase += 11000;\n    if (droneFrequency === 'weekly') monthlyBase += 20000;\n\n    // Addons\n    if (needWindowPanoramas) monthlyBase += 3500;\n    if (needMonthlyReels) monthlyBase += 4000;\n    if (needLiveStream) monthlyBase += 3000;\n\n    const totalEstimate = monthlyBase * durationMonths;\n    return {\n      monthly: monthlyBase,\n      total: totalEstimate\n    };\n  };",
    "  const calculateEstimate = () => {\n    let monthlyBase = timelapseCameras * pricing.timelapseCameraMonthly;\n    if (droneFrequency === 'monthly') monthlyBase += pricing.droneMonthly;\n    if (droneFrequency === 'biweekly') monthlyBase += pricing.droneBiweekly;\n    if (droneFrequency === 'weekly') monthlyBase += pricing.droneWeekly;\n    if (needWindowPanoramas) monthlyBase += pricing.windowPanoramasMonthly;\n    if (needMonthlyReels) monthlyBase += pricing.monthlyReels;\n    if (needLiveStream) monthlyBase += pricing.liveStreamMonthly;\n    return { monthly: monthlyBase, total: monthlyBase * durationMonths };\n  };",
)

print('Full Page Editing 3.0 migration applied.')
