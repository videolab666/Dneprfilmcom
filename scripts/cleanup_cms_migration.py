from pathlib import Path
import re


def replace_between(path: str, start: str, end: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    start_pos = text.find(start)
    end_pos = text.find(end)
    if start_pos == -1 or end_pos == -1 or end_pos <= start_pos:
        raise RuntimeError(f'Could not find cleanup markers in {path}')
    text = text[:start_pos] + end + text[end_pos + len(end):]
    file.write_text(text, encoding='utf-8')


# These large RU/UK arrays were the original page data. The pages now read the
# same content from structured CMS defaults / Firestore and no longer use them.
replace_between(
    'src/pages/VideoProduction.tsx',
    '// Real showcased works inspired directly by @dneprfilm152 channel',
    'export function VideoProduction() {'
)

replace_between(
    'src/pages/ConstructionMedia.tsx',
    '// Featured construction showcase items',
    'export function ConstructionMedia() {'
)

about = Path('src/pages/About.tsx')
text = about.read_text(encoding='utf-8')
pattern = re.compile(
    r"\n  const milestones_RU = \[.*?\n  const milestones = localize\(",
    re.DOTALL,
)
text, count = pattern.subn('\n  const milestones = localize(', text, count=1)
if count != 1:
    raise RuntimeError('Could not remove migrated About fallback arrays')
about.write_text(text, encoding='utf-8')

photo = Path('src/pages/PhotoProduction.tsx')
text = photo.read_text(encoding='utf-8')
old_import = "import { INITIAL_PHOTOS, INITIAL_PHOTOS_UK, PHOTO_PACKAGES, PHOTO_PACKAGES_UK, PhotoItem } from '../data/initialPhotos';"
if old_import not in text:
    raise RuntimeError('Could not find legacy PhotoProduction data import')
text = text.replace(old_import, "import type { PhotoItem } from '../data/initialPhotos';", 1)
photo.write_text(text, encoding='utf-8')
