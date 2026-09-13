export const PROJECT_RELATION_KIND = 'project_relation' as const;
export const PROJECT_RELATION_COLLECTION = 'site_settings';

export interface ProjectRelation {
  id: string;
  kind: typeof PROJECT_RELATION_KIND;
  caseId: string;
  galleryIds: string[];
  videoProjectIds: string[];
  updatedAt: number;
}

export function relationDocumentId(caseId: string): string {
  const safe = caseId.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `project-relation-${safe || 'case'}`;
}

export function isProjectRelation(value: unknown): value is ProjectRelation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProjectRelation>;
  return candidate.kind === PROJECT_RELATION_KIND
    && typeof candidate.caseId === 'string'
    && Array.isArray(candidate.galleryIds)
    && Array.isArray(candidate.videoProjectIds);
}
