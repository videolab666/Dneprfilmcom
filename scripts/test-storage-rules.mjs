import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteObject,
  getMetadata,
  ref,
  uploadBytes,
} from 'firebase/storage';

const projectId = 'gen-lang-client-0973206519';
const adminEmail = 'dneprfilmcom@gmail.com';
const rules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const imageBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

const testEnv = await initializeTestEnvironment({
  projectId,
  storage: { rules },
});

async function check(name, operation) {
  try {
    await operation();
    console.log(`OK: ${name}`);
  } catch (error) {
    console.error(`FAILED: ${name}`, error);
    throw error;
  }
}

try {
  await testEnv.clearStorage();

  await testEnv.withSecurityRulesDisabled(async context => {
    const storage = context.storage();
    await uploadBytes(
      ref(storage, 'cases/public/readable.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    );
    await uploadBytes(
      ref(storage, 'private/secret.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    );
    await uploadBytes(
      ref(storage, 'cases/admin/delete-me.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    );
  });

  const anonymousStorage = testEnv.unauthenticatedContext().storage();
  const userStorage = testEnv.authenticatedContext('regular-user', {
    email: 'user@example.com',
    email_verified: true,
  }).storage();
  const unverifiedAdminStorage = testEnv.authenticatedContext('unverified-admin', {
    email: adminEmail,
    email_verified: false,
  }).storage();
  const adminStorage = testEnv.authenticatedContext('verified-admin', {
    email: adminEmail,
    email_verified: true,
  }).storage();

  await check('public can read case media', async () => {
    await assertSucceeds(getMetadata(ref(anonymousStorage, 'cases/public/readable.webp')));
  });

  await check('public cannot read outside cases', async () => {
    await assertFails(getMetadata(ref(anonymousStorage, 'private/secret.webp')));
  });

  await check('anonymous upload is denied', async () => {
    await assertFails(uploadBytes(
      ref(anonymousStorage, 'cases/anonymous/blocked.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    ));
  });

  await check('authenticated non-admin upload is denied', async () => {
    await assertFails(uploadBytes(
      ref(userStorage, 'cases/user/blocked.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    ));
  });

  await check('admin email without verified email is denied', async () => {
    await assertFails(uploadBytes(
      ref(unverifiedAdminStorage, 'cases/admin/unverified.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    ));
  });

  await check('verified admin can upload an image under cases', async () => {
    await assertSucceeds(uploadBytes(
      ref(adminStorage, 'cases/admin/allowed.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    ));
  });

  await check('verified admin cannot upload non-image content', async () => {
    await assertFails(uploadBytes(
      ref(adminStorage, 'cases/admin/blocked.txt'),
      new TextEncoder().encode('not an image'),
      { contentType: 'text/plain' },
    ));
  });

  await check('verified admin cannot upload an image at or above 15 MiB', async () => {
    const oversizedImage = new Uint8Array(15 * 1024 * 1024);
    await assertFails(uploadBytes(
      ref(adminStorage, 'cases/admin/too-large.webp'),
      oversizedImage,
      { contentType: 'image/webp' },
    ));
  });

  await check('verified admin cannot write outside cases', async () => {
    await assertFails(uploadBytes(
      ref(adminStorage, 'private/admin.webp'),
      imageBytes,
      { contentType: 'image/webp' },
    ));
  });

  await check('verified admin can delete case media', async () => {
    await assertSucceeds(deleteObject(ref(adminStorage, 'cases/admin/delete-me.webp')));
  });

  console.log('Storage rules regression tests passed.');
} finally {
  await testEnv.cleanup();
}
