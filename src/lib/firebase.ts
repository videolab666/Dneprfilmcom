import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Long polling improves reliability in proxied/sandboxed environments.
// Optional form fields may be undefined, so omit them rather than failing the write.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId || 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e'
);
