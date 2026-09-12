from pathlib import Path

firebase = Path('src/lib/firebase.ts')
text = firebase.read_text(encoding='utf-8')
text = text.replace('export const app = initializeApp(firebaseConfig);', 'const app = initializeApp(firebaseConfig);', 1)
marker = '\nexport enum OperationType {'
pos = text.find(marker)
if pos == -1:
    raise RuntimeError('Could not find unused Firestore diagnostic block')
text = text[:pos].rstrip() + '\n'
firebase.write_text(text, encoding='utf-8')

translations = Path('src/locales/translations.ts')
text = translations.read_text(encoding='utf-8')
for old, new in (
    ('export const UK_TRANSLATIONS: TranslationDictionary = {', 'const UK_TRANSLATIONS: TranslationDictionary = {'),
    ('export const RU_TRANSLATIONS: TranslationDictionary = {', 'const RU_TRANSLATIONS: TranslationDictionary = {'),
):
    if old not in text:
        raise RuntimeError(f'Could not find translation export: {old}')
    text = text.replace(old, new, 1)
translations.write_text(text, encoding='utf-8')
