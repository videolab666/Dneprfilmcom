import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  query,
  serverTimestamp,
  setDoc,
  terminate,
  where,
} from 'firebase/firestore';

const projectId = 'gen-lang-client-0973206519';
const databaseId = 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e';

function createDb(name, mockUserToken) {
  const app = initializeApp({ projectId }, name);
  const firestore = initializeFirestore(
    app,
    { ignoreUndefinedProperties: true },
    databaseId,
  );
  connectFirestoreEmulator(
    firestore,
    '127.0.0.1',
    8080,
    mockUserToken ? { mockUserToken } : undefined,
  );
  return firestore;
}

const db = createDb('firestore-rules-public-test');
const adminDb = createDb('firestore-rules-admin-test', {
  sub: 'admin-test-user',
  email: 'dneprfilmcom@gmail.com',
  email_verified: true,
});

async function expectAllowed(name, operation) {
  try {
    await operation();
    console.log(`ALLOW OK: ${name}`);
  } catch (error) {
    console.error(`Expected ALLOW but was denied: ${name}`, error);
    process.exitCode = 1;
  }
}

async function expectDenied(name, operation) {
  try {
    await operation();
    console.error(`Expected DENY but operation succeeded: ${name}`);
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

await expectAllowed('home quick lead', () => addDoc(collection(db, 'leads'), {
  ...base,
  eventType: 'Головна: Консультація (LIVE)',
  cameraCount: 'За узгодженням',
  location: 'Україна (уточнюється)',
  hasStarlink: false,
  additionalServices: ['LIVE'],
  message: 'Test request',
}));

await expectAllowed('video calculator lead', () => addDoc(collection(db, 'leads'), {
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
}));

await expectAllowed('construction lead', () => addDoc(collection(db, 'leads'), {
  ...base,
  company: 'Developer LLC',
  service: 'Construction Media — Моніторинг будівництва',
  eventType: 'Будівельний об’єкт',
  message: '12 month monitoring',
  status: 'new',
}));

await expectAllowed('photo lead with server timestamp', () => addDoc(collection(db, 'leads'), {
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
}));

await expectAllowed('contacts lead with omitted undefined fields', () => addDoc(collection(db, 'leads'), {
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
}));

await expectAllowed('live production lead', () => addDoc(collection(db, 'leads'), {
  ...base,
  email: '',
  eventType: 'Бізнес-конференція / Форум',
  cameraCount: '3 камер(и)',
  location: 'Київ',
  hasStarlink: true,
  additionalServices: ['Starlink + Multi-SIM бондинг', 'Ефірна графіка та титри'],
  estimatedCost: 39000,
  message: '',
}));

await expectAllowed('media center consultation lead', () => addDoc(collection(db, 'leads'), {
  name: 'Media Center Client',
  phone: '+380931112233',
  source: 'media_center_consultation',
  question: 'Потрібна консультація щодо трансляції.',
  status: 'new',
  createdAt: serverTimestamp(),
}));

await expectDenied('unknown field injection', () => addDoc(collection(db, 'leads'), {
  ...base,
  admin: true,
}));

await expectDenied('oversized name', () => addDoc(collection(db, 'leads'), {
  ...base,
  name: 'x'.repeat(201),
}));

await expectDenied('forged status', () => addDoc(collection(db, 'leads'), {
  ...base,
  status: 'closed',
}));

await expectDenied('invalid calculator details', () => addDoc(collection(db, 'leads'), {
  ...base,
  calculatorDetails: {
    videoType: 'commercial',
    duration: '60s',
    needScript: 'yes',
  },
}));

await expectDenied('oversized media center question', () => addDoc(collection(db, 'leads'), {
  ...base,
  source: 'media_center_consultation',
  question: 'x'.repeat(5001),
}));

await expectDenied('missing phone', () => addDoc(collection(db, 'leads'), {
  name: 'No Phone',
  createdAt: Date.now(),
}));

// Seed portfolio documents as the authenticated administrator, then verify the
// exact read model used by the public React app.
await expectAllowed('admin seeds portfolio privacy fixtures', async () => {
  await Promise.all([
    setDoc(doc(adminDb, 'cases', 'rules-public-case'), { title: 'Public case', published: true, createdAt: Date.now() }),
    setDoc(doc(adminDb, 'cases', 'rules-draft-case'), { title: 'Draft case', published: false, createdAt: Date.now() }),
    setDoc(doc(adminDb, 'site_settings', 'global'), { studioName: 'Dneprfilm' }, { merge: true }),
    setDoc(doc(adminDb, 'site_settings', 'rules-public-gallery'), { kind: 'gallery', title: 'Public gallery', images: [], published: true, createdAt: Date.now() }),
    setDoc(doc(adminDb, 'site_settings', 'rules-draft-gallery'), { kind: 'gallery', title: 'Draft gallery', images: [], published: false, createdAt: Date.now() }),
    setDoc(doc(adminDb, 'site_settings', 'rules-public-video'), { kind: 'video_project', title: 'Public video', videos: [], published: true, createdAt: Date.now() }),
    setDoc(doc(adminDb, 'site_settings', 'rules-draft-video'), { kind: 'video_project', title: 'Draft video', videos: [], published: false, createdAt: Date.now() }),
    setDoc(doc(adminDb, 'site_settings', 'rules-relation'), { kind: 'project_relation', caseId: 'rules-public-case', galleryIds: ['rules-public-gallery'], videoProjectIds: ['rules-public-video'], updatedAt: Date.now() }),
    setDoc(doc(adminDb, 'site_settings', 'rules-media-asset'), { kind: 'media_asset', assetType: 'image', url: 'https://res.cloudinary.com/example/image/upload/test.jpg', createdAt: Date.now() }),
  ]);
});

await expectAllowed('public reads published case', () => getDoc(doc(db, 'cases', 'rules-public-case')));
await expectDenied('public cannot read draft case', () => getDoc(doc(db, 'cases', 'rules-draft-case')));
await expectAllowed('admin can read draft case', () => getDoc(doc(adminDb, 'cases', 'rules-draft-case')));
await expectAllowed('public published case query', async () => {
  const snapshot = await getDocs(query(collection(db, 'cases'), where('published', '==', true)));
  if (!snapshot.docs.some(item => item.id === 'rules-public-case')) throw new Error('Published case missing from query');
  if (snapshot.docs.some(item => item.id === 'rules-draft-case')) throw new Error('Draft case leaked into published query');
});
await expectDenied('public unfiltered case list is blocked', () => getDocs(collection(db, 'cases')));

await expectAllowed('public reads global settings', () => getDoc(doc(db, 'site_settings', 'global')));
await expectAllowed('public reads published gallery', () => getDoc(doc(db, 'site_settings', 'rules-public-gallery')));
await expectDenied('public cannot read draft gallery', () => getDoc(doc(db, 'site_settings', 'rules-draft-gallery')));
await expectAllowed('public reads published video', () => getDoc(doc(db, 'site_settings', 'rules-public-video')));
await expectDenied('public cannot read draft video', () => getDoc(doc(db, 'site_settings', 'rules-draft-video')));
await expectAllowed('public reads project relation', () => getDoc(doc(db, 'site_settings', 'rules-relation')));
await expectDenied('public cannot read media registry document', () => getDoc(doc(db, 'site_settings', 'rules-media-asset')));
await expectDenied('public unfiltered site_settings list is blocked', () => getDocs(collection(db, 'site_settings')));

await expectAllowed('public published gallery query', async () => {
  const snapshot = await getDocs(query(
    collection(db, 'site_settings'),
    where('kind', '==', 'gallery'),
    where('published', '==', true),
  ));
  if (!snapshot.docs.some(item => item.id === 'rules-public-gallery')) throw new Error('Published gallery missing from query');
  if (snapshot.docs.some(item => item.id === 'rules-draft-gallery')) throw new Error('Draft gallery leaked into published query');
});

await expectAllowed('public published video query', async () => {
  const snapshot = await getDocs(query(
    collection(db, 'site_settings'),
    where('kind', '==', 'video_project'),
    where('published', '==', true),
  ));
  if (!snapshot.docs.some(item => item.id === 'rules-public-video')) throw new Error('Published video missing from query');
  if (snapshot.docs.some(item => item.id === 'rules-draft-video')) throw new Error('Draft video leaked into published query');
});

await expectAllowed('public project relation query', async () => {
  const snapshot = await getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'project_relation')));
  if (!snapshot.docs.some(item => item.id === 'rules-relation')) throw new Error('Relation missing from query');
});

await terminate(db);
await terminate(adminDb);

if (process.exitCode) process.exit(process.exitCode);
console.log('Firestore rules regression tests passed.');
