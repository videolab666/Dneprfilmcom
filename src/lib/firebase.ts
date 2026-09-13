import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const functions = getFunctions(firebaseApp, 'europe-west1');

// Long polling improves reliability in proxied/sandboxed environments.
// Optional form fields may be undefined, so omit them rather than failing the write.
export const db = initializeFirestore(
  firebaseApp,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId || 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e'
);
