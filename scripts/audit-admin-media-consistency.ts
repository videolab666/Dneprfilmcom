import { readFileSync } from 'node:fs';

const checks: Array<{ file: string; mustContain: string[]; mustNotContain?: string[] }> = [
  {
    file: 'src/components/admin/ArticlesManager.tsx',
    mustContain: ['AdminImageField', 'label="Обложка статьи"'],
    mustNotContain: ['URL обложки'],
  },
  {
    file: 'src/components/admin/BackstageManager.tsx',
    mustContain: ['AdminImageField', 'label="Изображение карточки"'],
    mustNotContain: ['URL изображения<input'],
  },
  {
    file: 'src/components/admin/TestimonialsManager.tsx',
    mustContain: ['AdminImageField', 'label="Аватар клиента"'],
    mustNotContain: ['URL аватара<input'],
  },
  {
    file: 'src/components/admin/BlocksManager.tsx',
    mustContain: ['AdminImageField', 'label="Изображение блока"'],
    mustNotContain: ['URL изображения (общий)'],
  },
  {
    file: 'src/components/admin/SiteSettingsEditor.tsx',
    mustContain: ['label="Fallback-фото Hero"', 'label="Фотография основателя"'],
    mustNotContain: ['Фотография основателя (URL)'],
  },
  {
    file: 'src/components/admin/HeroSlidesEditor.tsx',
    mustContain: ['Фото из медиатеки', 'Видео из медиатеки', 'registerMediaAsset'],
  },
  {
    file: 'src/lib/mediaLibrary.ts',
    mustContain: [
      "collection(db, 'articles')",
      "collection(db, 'testimonials')",
      "collection(db, 'backstage')",
      "collection(db, 'site_blocks')",
    ],
  },
];

let failed = false;

for (const check of checks) {
  const source = readFileSync(check.file, 'utf8');
  for (const needle of check.mustContain) {
    if (!source.includes(needle)) {
      console.error(`FAIL ${check.file}: missing ${JSON.stringify(needle)}`);
      failed = true;
    }
  }
  for (const needle of check.mustNotContain || []) {
    if (source.includes(needle)) {
      console.error(`FAIL ${check.file}: stale URL-only UI ${JSON.stringify(needle)}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Admin media consistency audit passed.');
