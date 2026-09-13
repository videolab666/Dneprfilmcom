# Cloudinary Admin Backend

The public React app keeps using unsigned Cloudinary uploads. Cloudinary Admin API credentials are **never** exposed to the browser.

A Firebase Functions v2 callable named `cloudinaryMediaAdmin` performs privileged Cloudinary operations.

## What it does

- requires Firebase Authentication;
- only accepts the verified administrator `dneprfilmcom@gmail.com`;
- reads the named Firestore database `ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e`;
- scans the CMS content collections for Cloudinary references;
- lists real Cloudinary `dneprfilm/*` images and videos;
- reports total bytes and orphan bytes;
- before every delete, scans Firestore again on the server;
- refuses to delete referenced assets;
- deletes only public IDs under `dneprfilm/`;
- removes stale `media_asset` registry documents after successful Cloudinary deletion.

## One-time Firebase setup

Cloud Functions production deployment requires the Firebase project to be on the Blaze plan.

From Firebase CLI / Google Cloud Shell, set the two secrets in Google Secret Manager:

```bash
firebase functions:secrets:set CLOUDINARY_API_KEY --project gen-lang-client-0973206519
firebase functions:secrets:set CLOUDINARY_API_SECRET --project gen-lang-client-0973206519
```

Use the API Key and API Secret from Cloudinary Console -> Settings -> API Keys for cloud `n6l9imb7`.

Then deploy manually once if desired:

```bash
firebase deploy --only functions:cloudinaryMediaAdmin --project gen-lang-client-0973206519
```

## GitHub Actions deployment

`.github/workflows/deploy-functions.yml` always validates the function on relevant pull requests. Production deploy is deliberately disabled by default.

To enable automatic deploy from `main`:

1. Configure Google Workload Identity Federation for the repository.
2. Add repository secret `GCP_WORKLOAD_IDENTITY_PROVIDER`.
3. Add repository secret `GCP_FIREBASE_FUNCTIONS_SERVICE_ACCOUNT` for a service account allowed to deploy Cloud Functions v2 and use the required build/runtime services.
4. Set repository variable `FIREBASE_FUNCTIONS_DEPLOY_ENABLED=true`.
5. Keep the Cloudinary credentials in Google Secret Manager; do not add them to the repository or frontend environment.

## Admin UI behavior

The Media Library works without the backend. The `Cloudinary audit` button is an optional privileged operation. If the function is not deployed yet, the UI shows a setup error and the existing CMS media index/upload/picker functionality remains available.
