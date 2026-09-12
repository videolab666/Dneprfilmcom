import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  initializeFirestore,
  serverTimestamp,
  terminate,
} from 'firebase/firestore';

const projectId = 'gen-lang-client-0973206519';
const databaseId = 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e';
const app = initializeApp({ projectId }, 'firestore-rules-test');
const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  databaseId,
);

connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function expectAllowed(name, data) {
  try {
    await addDoc(collection(db, 'leads'), data);
    console.log(`ALLOW OK: ${name}`);
  } catch (error) {
    console.error(`Expected ALLOW but was denied: ${name}`, error);
    process.exitCode = 1;
  }
}

async function expectDenied(name, data) {
  try {
    await addDoc(collection(db, 'leads'), data);
    console.error(`Expected DENY but write succeeded: ${name}`);
    process.exitCode = 1;
  } catch (error) {
    const code = String(error?.code || '');
    if (!code.includes('permission-denied')) {
      console.error(`Expected permission-denied for ${name}, got:`, error);
      process.exitCode = 1;
      return;
    }
    console.log(`DENY OK: ${name}`);
  }
}

const base = {
  name: 'Test Client',
  phone: '+380675606880',
  createdAt: Date.now(),
};

await expectAllowed('home quick lead', {
  ...base,
  eventType: 'Головна: Консультація (LIVE)',
  cameraCount: 'За узгодженням',
  location: 'Україна (уточнюється)',
  hasStarlink: false,
  additionalServices: ['LIVE'],
  message: 'Test request',
});

await expectAllowed('video calculator lead', {
  ...base,
  email: 'client@example.com',
  service: 'Відеопродакшн',
  eventType: 'Відео: commercial, хронометраж: 60s',
  calculatedCost: 32500,
  calculatorDetails: {
    videoType: 'commercial',
    duration: '60s',
    needScript: true,
    needActors: false,
    needDrone: true,
    needVoiceover: true,
    needGraphics3D: false,
  },
  message: 'Promo video',
  status: 'new',
});

await expectAllowed('construction lead', {
  ...base,
  company: 'Developer LLC',
  service: 'Construction Media — Моніторинг будівництва',
  eventType: 'Будівельний об’єкт',
  message: '12 month monitoring',
  status: 'new',
});

await expectAllowed('photo lead with server timestamp', {
  name: 'Photo Client',
  phone: '+380501112233',
  source: 'photography_booking',
  contactDetail: '@client',
  serviceType: 'Фотозйомка: interior',
  desiredDate: '2026-10-01',
  locationDetails: 'Dnipro',
  comment: 'Interior shoot',
  status: 'new',
  createdAt: serverTimestamp(),
});

await expectAllowed('contacts lead with omitted undefined fields', {
  ...base,
  email: undefined,
  service: 'LIVE',
  eventType: 'Контакти: Заявка на розрахунок (LIVE)',
  location: 'Дніпро',
  cameraCount: 'Уточнюється в ТЗ',
  preferredContact: 'telegram',
  eventDate: undefined,
  message: undefined,
  status: 'new',
});

await expectAllowed('live production lead', {
  ...base,
  email: '',
  eventType: 'Бізнес-конференція / Форум',
  cameraCount: '3 камер(и)',
  location: 'Київ',
  hasStarlink: true,
  additionalServices: ['Starlink + Multi-SIM бондинг', 'Ефірна графіка та титри'],
  estimatedCost: 39000,
  message: '',
});

await expectAllowed('media center consultation lead', {
  name: 'Media Center Client',
  phone: '+380931112233',
  source: 'media_center_consultation',
  question: 'Потрібна консультація щодо трансляції.',
  status: 'new',
  createdAt: serverTimestamp(),
});

await expectDenied('unknown field injection', {
  ...base,
  admin: true,
});

await expectDenied('oversized name', {
  ...base,
  name: 'x'.repeat(201),
});

await expectDenied('forged status', {
  ...base,
  status: 'closed',
});

await expectDenied('invalid calculator details', {
  ...base,
  calculatorDetails: {
    videoType: 'commercial',
    duration: '60s',
    needScript: 'yes',
  },
});

await expectDenied('oversized media center question', {
  ...base,
  source: 'media_center_consultation',
  question: 'x'.repeat(5001),
});

await expectDenied('missing phone', {
  name: 'No Phone',
  createdAt: Date.now(),
});

await terminate(db);

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Firestore rules regression tests passed.');
