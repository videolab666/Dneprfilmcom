import { INITIAL_CASES } from '../src/data/initialCases';
import { CASE_TRANSLATIONS_UK } from '../src/locales/localizedContent';

const requiredFields = [
  'title',
  'categoryLabel',
  'description',
  'challenge',
  'solution',
  'result',
] as const;

const failures: string[] = [];

for (const item of INITIAL_CASES) {
  const uk = CASE_TRANSLATIONS_UK[item.id];
  if (!uk) {
    failures.push(`${item.id}: missing Ukrainian translation`);
    continue;
  }

  for (const field of requiredFields) {
    const value = uk[field];
    if (typeof value !== 'string' || !value.trim()) {
      failures.push(`${item.id}: missing Ukrainian ${field}`);
    }
  }

  if (!Array.isArray(uk.metrics) || uk.metrics.length === 0) {
    failures.push(`${item.id}: missing Ukrainian metrics`);
  }
}

if (failures.length) {
  console.error('Ukrainian case coverage audit failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Ukrainian case coverage OK: ${INITIAL_CASES.length} bundled cases.`);
