import { readFileSync } from 'node:fs';

const source = readFileSync('src/lib/mediaLibrary.ts', 'utf8');
const requiredCollections = ['site_settings', 'cases', 'articles', 'testimonials', 'backstage', 'site_blocks'];

for (const name of requiredCollections) {
  if (!source.includes(`collection(db, '${name}')`)) {
    console.error(`Media Library scanner is missing Firestore collection: ${name}`);
    process.exit(1);
  }
}

console.log(`Media Library scanner covers: ${requiredCollections.join(', ')}`);
