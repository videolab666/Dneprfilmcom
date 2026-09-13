import { collection, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { GALLERY_KIND } from './galleryContent';
import { VIDEO_PROJECT_KIND } from './videoPortfolio';
import { PROJECT_RELATION_KIND } from './projectRelations';

export function publishedCasesQuery() {
  return query(collection(db, 'cases'), where('published', '==', true));
}

export function publishedGalleriesQuery() {
  return query(
    collection(db, 'site_settings'),
    where('kind', '==', GALLERY_KIND),
    where('published', '==', true),
  );
}

export function publishedVideoProjectsQuery() {
  return query(
    collection(db, 'site_settings'),
    where('kind', '==', VIDEO_PROJECT_KIND),
    where('published', '==', true),
  );
}

export function publicProjectRelationsQuery() {
  return query(
    collection(db, 'site_settings'),
    where('kind', '==', PROJECT_RELATION_KIND),
  );
}
