from __future__ import annotations

import ast
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC_GLOBS = [
    'src/pages/*.tsx',
    'src/components/home/*.tsx',
    'src/components/layout/*.tsx',
]


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def parse_literal(token: str) -> str | None:
    try:
        # The legacy strings in this project use JS escapes that are compatible
        # with Python single/double quoted literals.
        value = ast.literal_eval(token)
        return value if isinstance(value, str) else None
    except Exception:
        return None


STRING = r"(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")"
SIMPLE_TERNARY = re.compile(
    rf"\bisUk\s*\?\s*(?P<uk>{STRING})\s*:\s*(?P<ru>{STRING})",
    re.S,
)


def replace_simple_ternaries(text: str) -> tuple[str, int]:
    count = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal count
        uk = parse_literal(match.group('uk'))
        ru = parse_literal(match.group('ru'))
        if uk is None or ru is None:
            return match.group(0)
        count += 1
        return f"l({js_string(uk)}, {js_string(ru)})"

    return SIMPLE_TERNARY.sub(repl, text), count


def find_matching(text: str, start: int, opening: str, closing: str) -> int:
    assert text[start] == opening
    depth = 0
    quote: str | None = None
    escape = False
    i = start
    while i < len(text):
        ch = text[i]
        if quote:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch in "'\"`":
            quote = ch
            i += 1
            continue
        if ch == opening:
            depth += 1
        elif ch == closing:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError(f'Unbalanced {opening}{closing} at {start}')


def replace_array_ternaries(text: str) -> tuple[str, int]:
    """Convert isUk ? [UK] : [RU] into legacy([UK], [RU])."""
    marker = 'isUk ? ['
    replacements: list[tuple[int, int, str]] = []
    pos = 0
    while True:
        idx = text.find(marker, pos)
        if idx < 0:
            break
        first_start = text.find('[', idx)
        try:
            first_end = find_matching(text, first_start, '[', ']')
        except ValueError:
            pos = idx + len(marker)
            continue
        j = first_end + 1
        while j < len(text) and text[j].isspace():
            j += 1
        if j >= len(text) or text[j] != ':':
            pos = idx + len(marker)
            continue
        j += 1
        while j < len(text) and text[j].isspace():
            j += 1
        if j >= len(text) or text[j] != '[':
            pos = idx + len(marker)
            continue
        second_start = j
        try:
            second_end = find_matching(text, second_start, '[', ']')
        except ValueError:
            pos = idx + len(marker)
            continue
        uk = text[first_start:first_end + 1]
        ru = text[second_start:second_end + 1]
        replacements.append((idx, second_end + 1, f'legacy({uk}, {ru})'))
        pos = second_end + 1

    for start, end, replacement in reversed(replacements):
        text = text[:start] + replacement + text[end:]
    return text, len(replacements)


def ensure_context_members(text: str, members: list[str]) -> str:
    # Add fields to every destructuring assignment that actually needs them.
    pattern = re.compile(r"const\s*\{(?P<body>[^{}]*?)\}\s*=\s*useSiteContent\(\);", re.S)

    def repl(match: re.Match[str]) -> str:
        body = match.group('body')
        existing = {part.strip().split(':', 1)[0].strip() for part in body.split(',') if part.strip()}
        missing = [member for member in members if member not in existing]
        if not missing:
            return match.group(0)
        body_stripped = body.rstrip()
        suffix = '' if body_stripped.endswith(',') else ','
        return f"const {{{body_stripped}{suffix} {', '.join(missing)} }} = useSiteContent();"

    return pattern.sub(repl, text)


def update_context() -> None:
    path = ROOT / 'src/context/SiteContentContext.tsx'
    text = path.read_text(encoding='utf-8')
    if "../locales/legacyEnglish" not in text:
        text = text.replace(
            "import { TRANSLATIONS } from '../locales/translations';",
            "import { TRANSLATIONS } from '../locales/translations';\nimport { legacyText, legacyValue } from '../locales/legacyEnglish';",
        )
    if "l: (uk: string" not in text:
        text = text.replace(
            "  t: (key: string, fallback?: string) => string;",
            "  t: (key: string, fallback?: string) => string;\n  l: (uk: string, ru: string, en?: string) => string;\n  legacy: <T>(uk: T, ru: T) => T;",
        )

    old_init = """      const saved = localStorage.getItem('dneprfilm_locale');\n      if (saved === 'ru' || saved === 'uk') {\n        return saved;\n      }"""
    new_init = """      const requested = new URLSearchParams(window.location.search).get('lang');\n      if (requested === 'ru' || requested === 'uk' || requested === 'en') {\n        return requested;\n      }\n      const saved = localStorage.getItem('dneprfilm_locale');\n      if (saved === 'ru' || saved === 'uk' || saved === 'en') {\n        return saved;\n      }"""
    text = text.replace(old_init, new_init)

    if "const l = (uk: string" not in text:
        anchor = """  const isUk = locale === 'uk';\n  const isEn = locale === 'en';\n  const isRu = locale === 'ru';"""
        replacement = """  const l = (uk: string, ru: string, en?: string): string => legacyText(locale, uk, ru, en);\n  const legacy = <T,>(uk: T, ru: T): T => legacyValue(locale, uk, ru);\n\n  const isUk = locale === 'uk';\n  const isEn = locale === 'en';\n  const isRu = locale === 'ru';"""
        text = text.replace(anchor, replacement)

    if "        l," not in text:
        text = text.replace("        t,\n        isUk,", "        t,\n        l,\n        legacy,\n        isUk,")
    path.write_text(text, encoding='utf-8')


def update_page_content_fallback() -> None:
    path = ROOT / 'src/data/pageContent.ts'
    text = path.read_text(encoding='utf-8')
    if "translateEnglishValue" not in text.splitlines()[0:5]:
        text = "import { translateEnglishValue } from '../locales/legacyEnglish';\n" + text
    text = text.replace(
        "  if (locale === 'en') return item.en || item.uk || item.ru;",
        "  if (locale === 'en') return item.en || translateEnglishValue(item.uk || item.ru);",
    )
    path.write_text(text, encoding='utf-8')


def update_legacy_export() -> None:
    path = ROOT / 'src/locales/legacyEnglish.ts'
    text = path.read_text(encoding='utf-8')
    text = text.replace('function translateEnglishValue<T>(value: T): T {', 'export function translateEnglishValue<T>(value: T): T {')
    path.write_text(text, encoding='utf-8')


def update_public_files() -> None:
    paths: list[pathlib.Path] = []
    for glob in PUBLIC_GLOBS:
        paths.extend(ROOT.glob(glob))

    # Admin UI is intentionally not part of the public-language release.
    excluded = {'AdminDashboard.tsx', 'AdminLogin.tsx'}

    for path in sorted(set(paths)):
        if path.name in excluded:
            continue
        text = path.read_text(encoding='utf-8')
        original = text
        text, simple_count = replace_simple_ternaries(text)
        text, array_count = replace_array_ternaries(text)

        # Named bilingual datasets.
        text = text.replace('const steps = isUk ? STEPS_UK : STEPS_RU;', 'const steps = legacy(STEPS_UK, STEPS_RU);')
        text = text.replace('const services = isUk ? SERVICES_UK : SERVICES_RU;', 'const services = legacy(SERVICES_UK, SERVICES_RU);')
        text = text.replace('const contactCards = isUk ? contactCards_UK : contactCards_RU;', 'const contactCards = legacy(contactCards_UK, contactCards_RU);')
        text = text.replace('const locations = isUk ? locations_UK : locations_RU;', 'const locations = legacy(locations_UK, locations_RU);')
        text = text.replace('const faqs = isUk ? faqs_UK : faqs_RU;', 'const faqs = legacy(faqs_UK, faqs_RU);')
        text = text.replace('const riderItems = isUk ? TECH_RIDER_ITEMS_UK : TECH_RIDER_ITEMS;', 'const riderItems = legacy(TECH_RIDER_ITEMS_UK, TECH_RIDER_ITEMS);')
        text = text.replace('const downloadableDocs = isUk ? DOWNLOADABLE_DOCS_UK : DOWNLOADABLE_DOCS;', 'const downloadableDocs = legacy(DOWNLOADABLE_DOCS_UK, DOWNLOADABLE_DOCS);')

        # Locale-aware founder fallbacks on Home.
        text = text.replace('settings.founderName || "Александр Питель"', 'settings.founderName || l("Олександр Пітель", "Александр Питель")')
        text = text.replace('settings.founderRole || "Основатель студии"', 'settings.founderRole || l("Засновник студії", "Основатель студии", "Studio founder")')

        if text != original:
            needs = []
            if 'l(' in text:
                needs.append('l')
            if 'legacy(' in text:
                needs.append('legacy')
            # locale is needed by NotFound/manual fixes later, not globally here.
            if needs:
                text = ensure_context_members(text, needs)
            path.write_text(text, encoding='utf-8')
            print(f'updated {path.relative_to(ROOT)}: simple={simple_count}, arrays={array_count}')


def update_navbar() -> None:
    path = ROOT / 'src/components/layout/Navbar.tsx'
    text = path.read_text(encoding='utf-8')
    desktop_ru = """              <button\n                type=\"button\"\n                onClick={() => setLocale('ru')}\n                className={cn(\n                  \"px-2.5 py-1 rounded-full transition-all duration-200\",\n                  locale === 'ru'\n                    ? \"bg-indigo-600 text-white shadow-xs\"\n                    : \"text-slate-600 hover:text-slate-900\"\n                )}\n                title=\"Русский\"\n              >\n                RU\n              </button>"""
    desktop_en = desktop_ru + """\n              <button\n                type=\"button\"\n                onClick={() => setLocale('en')}\n                className={cn(\n                  \"px-2.5 py-1 rounded-full transition-all duration-200\",\n                  locale === 'en'\n                    ? \"bg-indigo-600 text-white shadow-xs\"\n                    : \"text-slate-600 hover:text-slate-900\"\n                )}\n                title=\"English\"\n              >\n                EN\n              </button>"""
    if "onClick={() => setLocale('en')}" not in text:
        text = text.replace(desktop_ru, desktop_en)

        mobile_ru = """              <button\n                type=\"button\"\n                onClick={() => setLocale('ru')}\n                className={cn(\n                  \"px-2 py-0.5 rounded-full transition-all\",\n                  locale === 'ru' ? \"bg-indigo-600 text-white\" : \"text-slate-600\"\n                )}\n              >\n                RU\n              </button>"""
        mobile_en = mobile_ru + """\n              <button\n                type=\"button\"\n                onClick={() => setLocale('en')}\n                className={cn(\n                  \"px-2 py-0.5 rounded-full transition-all\",\n                  locale === 'en' ? \"bg-indigo-600 text-white\" : \"text-slate-600\"\n                )}\n              >\n                EN\n              </button>"""
        text = text.replace(mobile_ru, mobile_en)
    path.write_text(text, encoding='utf-8')


def update_not_found() -> None:
    path = ROOT / 'src/pages/NotFound.tsx'
    text = path.read_text(encoding='utf-8')
    # Convert the locale selection without rewriting the page layout.
    text = text.replace('const { isUk } = useSiteContent();', 'const { locale, legacy } = useSiteContent();')
    text = text.replace('const copy = isUk ? COPY_UK : COPY_RU;', 'const copy = legacy(COPY_UK, COPY_RU);')
    path.write_text(text, encoding='utf-8')


def main() -> None:
    update_legacy_export()
    update_context()
    update_page_content_fallback()
    update_public_files()
    update_navbar()
    update_not_found()


if __name__ == '__main__':
    main()
