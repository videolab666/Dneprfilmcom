const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { v2: cloudinary } = require('cloudinary');

initializeApp();

const CLOUDINARY_API_KEY = defineSecret('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = defineSecret('CLOUDINARY_API_SECRET');
const CLOUDINARY_CLOUD_NAME = 'n6l9imb7';
const CLOUDINARY_PREFIX = 'dneprfilm/';
const FIRESTORE_DATABASE_ID = 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e';
const ADMIN_EMAIL = 'dneprfilmcom@gmail.com';
const CONTENT_COLLECTIONS = ['cases', 'articles', 'site_settings', 'site_blocks', 'testimonials', 'backstage'];
const MAX_CLOUDINARY_ASSETS = 5000;
const MAX_REFERENCE_SAMPLES = 8;

function assertAdmin(request) {
  const token = request.auth && request.auth.token;
  if (!token || token.email !== ADMIN_EMAIL || token.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Cloudinary management is restricted to the verified site administrator.');
  }
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY.value(),
    api_secret: CLOUDINARY_API_SECRET.value(),
    secure: true,
  });
}

function assetKey(resourceType, publicId) {
  return `${resourceType}:${publicId}`;
}

function parseCloudinaryUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== 'res.cloudinary.com') return null;
    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');
    if (uploadIndex < 2) return null;
    const resourceType = segments[uploadIndex - 1];
    if (resourceType !== 'image' && resourceType !== 'video') return null;

    let start = segments.findIndex((segment, index) => index > uploadIndex && /^v\d+$/.test(segment));
    if (start >= 0) {
      start += 1;
    } else {
      start = segments.findIndex((segment, index) => index > uploadIndex && segment === 'dneprfilm');
    }
    if (start < 0 || start >= segments.length) return null;

    const path = decodeURIComponent(segments.slice(start).join('/'));
    const publicId = path.replace(/\.[a-z0-9]+$/i, '');
    if (!publicId.startsWith(CLOUDINARY_PREFIX)) return null;
    return { resourceType, publicId };
  } catch {
    return null;
  }
}

function addReference(index, resourceType, publicId, reference) {
  if (!publicId || !publicId.startsWith(CLOUDINARY_PREFIX)) return;
  const key = assetKey(resourceType, publicId);
  const current = index.get(key) || { count: 0, samples: [] };
  current.count += 1;
  if (current.samples.length < MAX_REFERENCE_SAMPLES) current.samples.push(reference);
  index.set(key, current);
}

function scanValue(value, path, context, index, depth = 0) {
  if (value == null || depth > 16) return;

  if (typeof value === 'string') {
    const parsed = parseCloudinaryUrl(value);
    if (parsed) {
      addReference(index, parsed.resourceType, parsed.publicId, { ...context, field: path || 'root' });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, itemIndex) => scanValue(item, `${path}[${itemIndex}]`, context, index, depth + 1));
    return;
  }

  if (typeof value !== 'object') return;
  const record = value;
  const siblingUrl = typeof record.url === 'string' ? parseCloudinaryUrl(record.url) : null;

  for (const [key, child] of Object.entries(record)) {
    const childPath = path ? `${path}.${key}` : key;
    if ((key === 'cloudinaryPublicId' || key === 'publicId') && typeof child === 'string' && child.startsWith(CLOUDINARY_PREFIX)) {
      if (siblingUrl) {
        addReference(index, siblingUrl.resourceType, child, { ...context, field: childPath });
      } else {
        // If an old document has only a public ID, protect both resource types rather than risk deleting a used asset.
        addReference(index, 'image', child, { ...context, field: childPath });
        addReference(index, 'video', child, { ...context, field: childPath });
      }
      continue;
    }
    scanValue(child, childPath, context, index, depth + 1);
  }
}

function documentTitle(data, fallback) {
  for (const key of ['title_uk', 'title', 'title_en', 'name_uk', 'name', 'name_en', 'client']) {
    if (typeof data[key] === 'string' && data[key].trim()) return data[key].trim();
  }
  return fallback;
}

async function buildUsageIndex(db) {
  const index = new Map();
  let scannedDocuments = 0;

  for (const collectionName of CONTENT_COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // media_asset is only an inventory record, not a real content reference.
      if (collectionName === 'site_settings' && data.kind === 'media_asset') continue;
      scannedDocuments += 1;
      scanValue(data, '', {
        collection: collectionName,
        documentId: doc.id,
        title: documentTitle(data, doc.id),
      }, index);
    }
  }

  return { index, scannedDocuments };
}

async function listResources(resourceType) {
  const assets = [];
  let nextCursor;
  do {
    const response = await cloudinary.api.resources({
      resource_type: resourceType,
      type: 'upload',
      prefix: CLOUDINARY_PREFIX,
      max_results: 500,
      next_cursor: nextCursor,
    });
    for (const resource of response.resources || []) {
      assets.push({
        assetId: resource.asset_id,
        publicId: resource.public_id,
        resourceType,
        url: resource.secure_url,
        bytes: resource.bytes || 0,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        createdAt: resource.created_at,
        folder: resource.asset_folder || resource.folder,
      });
      if (assets.length >= MAX_CLOUDINARY_ASSETS) break;
    }
    nextCursor = assets.length >= MAX_CLOUDINARY_ASSETS ? undefined : response.next_cursor;
  } while (nextCursor);
  return assets;
}

async function auditCloudinary(db) {
  const [{ index, scannedDocuments }, images, videos] = await Promise.all([
    buildUsageIndex(db),
    listResources('image'),
    listResources('video'),
  ]);

  const assets = [...images, ...videos].map((asset) => {
    const usage = index.get(assetKey(asset.resourceType, asset.publicId)) || { count: 0, samples: [] };
    return {
      ...asset,
      referenceCount: usage.count,
      references: usage.samples,
      used: usage.count > 0,
    };
  }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  const totalBytes = assets.reduce((sum, asset) => sum + (asset.bytes || 0), 0);
  const orphanAssets = assets.filter((asset) => !asset.used);
  const orphanBytes = orphanAssets.reduce((sum, asset) => sum + (asset.bytes || 0), 0);

  return {
    assets,
    summary: {
      total: assets.length,
      images: images.length,
      videos: videos.length,
      used: assets.length - orphanAssets.length,
      orphaned: orphanAssets.length,
      totalBytes,
      orphanBytes,
      scannedDocuments,
      truncated: images.length >= MAX_CLOUDINARY_ASSETS || videos.length >= MAX_CLOUDINARY_ASSETS,
    },
    generatedAt: Date.now(),
  };
}

async function removeRegistryRecords(db, resourceType, publicId) {
  const snapshot = await db.collection('site_settings').get();
  const batch = db.batch();
  let changes = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.kind !== 'media_asset') continue;
    const parsed = typeof data.url === 'string' ? parseCloudinaryUrl(data.url) : null;
    const matches = data.publicId === publicId || (parsed && parsed.publicId === publicId && parsed.resourceType === resourceType);
    if (matches) {
      batch.delete(doc.ref);
      changes += 1;
    }
  }
  if (changes > 0) await batch.commit();
  return changes;
}

async function deleteCloudinaryAsset(db, data) {
  const publicId = typeof data.publicId === 'string' ? data.publicId.trim() : '';
  const resourceType = data.resourceType === 'video' ? 'video' : data.resourceType === 'image' ? 'image' : '';
  if (!resourceType || !publicId.startsWith(CLOUDINARY_PREFIX)) {
    throw new HttpsError('invalid-argument', 'Only image/video assets inside dneprfilm/ can be deleted.');
  }

  const { index } = await buildUsageIndex(db);
  const usage = index.get(assetKey(resourceType, publicId));
  if (usage && usage.count > 0) {
    throw new HttpsError('failed-precondition', `Asset is still referenced ${usage.count} time(s).`, {
      referenceCount: usage.count,
      references: usage.samples,
    });
  }

  const response = await cloudinary.api.delete_resources([publicId], {
    resource_type: resourceType,
    type: 'upload',
    invalidate: true,
  });
  const status = response.deleted && response.deleted[publicId];
  if (status !== 'deleted' && status !== 'not_found') {
    throw new HttpsError('internal', `Cloudinary did not confirm deletion (${status || 'unknown'}).`);
  }

  const registryRecordsRemoved = await removeRegistryRecords(db, resourceType, publicId);
  return { publicId, resourceType, status, registryRecordsRemoved };
}

exports.cloudinaryMediaAdmin = onCall({
  region: 'europe-west1',
  timeoutSeconds: 120,
  memory: '256MiB',
  maxInstances: 2,
  secrets: [CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET],
}, async (request) => {
  assertAdmin(request);
  configureCloudinary();
  const db = getFirestore(FIRESTORE_DATABASE_ID);
  const action = request.data && request.data.action;

  try {
    if (action === 'audit') return await auditCloudinary(db);
    if (action === 'delete') return await deleteCloudinaryAsset(db, request.data || {});
    throw new HttpsError('invalid-argument', 'Unknown Cloudinary admin action.');
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Cloudinary admin failure:', error);
    throw new HttpsError('internal', error instanceof Error ? error.message : 'Cloudinary admin operation failed.');
  }
});
