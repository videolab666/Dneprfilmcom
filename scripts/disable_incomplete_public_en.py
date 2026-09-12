from pathlib import Path

navbar = Path('src/components/layout/Navbar.tsx')
text = navbar.read_text(encoding='utf-8')

desktop_en = '''              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all duration-200",
                  locale === 'en'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="English"
              >
                EN
              </button>
'''
mobile_en = '''              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  "px-2 py-0.5 rounded-full transition-all",
                  locale === 'en' ? "bg-indigo-600 text-white" : "text-slate-600"
                )}
              >
                EN
              </button>
'''

for snippet, label in ((desktop_en, 'desktop EN button'), (mobile_en, 'mobile EN button')):
    if snippet not in text:
        raise RuntimeError(f'Could not find {label}')
    text = text.replace(snippet, '', 1)

navbar.write_text(text, encoding='utf-8')

context = Path('src/context/SiteContentContext.tsx')
text = context.read_text(encoding='utf-8')
old = "if (saved === 'ru' || saved === 'uk' || saved === 'en') {"
new = "if (saved === 'ru' || saved === 'uk') {"
if old not in text:
    raise RuntimeError('Could not find persisted-locale condition')
text = text.replace(old, new, 1)
context.write_text(text, encoding='utf-8')
