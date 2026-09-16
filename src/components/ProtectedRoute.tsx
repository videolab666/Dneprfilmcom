import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ensureCmsMigrations,
  isFirestorePermissionDenied,
  isFirestoreQuotaExceeded,
} from '../lib/cmsMigrationGate';

const ADMIN_EMAIL = 'dneprfilmcom@gmail.com';

type MigrationState = 'idle' | 'running' | 'done' | 'deferred' | 'error';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const [migrationState, setMigrationState] = useState<MigrationState>('idle');
  const [migrationError, setMigrationError] = useState('');

  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;

  useEffect(() => {
    if (!isAdmin || migrationState !== 'idle') return;

    setMigrationState('running');
    ensureCmsMigrations()
      .then(result => {
        const changed = Object.values(result.seed).reduce((sum, count) => sum + count, 0)
          + result.legacyConstructionEnglishBackfilled;

        if (changed > 0) {
          console.info('CMS migration completed:', {
            ...result.seed,
            legacyConstructionEnglishBackfilled: result.legacyConstructionEnglishBackfilled,
            initialVersion: result.initialVersion,
            portfolioMigrationVersion: result.finalVersion,
          });
        } else if (result.skipped) {
          console.debug(`CMS migration already current (v${result.finalVersion}); collection scans skipped.`);
        }

        setMigrationError('');
        setMigrationState('done');
      })
      .catch(error => {
        console.error('CMS migration check failed:', error);

        if (isFirestoreQuotaExceeded(error)) {
          setMigrationError(
            'Дневная квота чтений Firestore исчерпана. Автоматическая миграция отложена; Firestore Rules здесь ни при чём. '
            + 'Данные CMS могут быть временно недоступны. После сброса квоты или Upgrade database обновите страницу.',
          );
          setMigrationState('deferred');
          return;
        }

        if (isFirestorePermissionDenied(error)) {
          setMigrationError(
            'Firestore отклонил доступ (permission-denied). Проверьте опубликованные Firestore Rules и авторизацию администратора.',
          );
          setMigrationState('error');
          return;
        }

        setMigrationError(
          `Не удалось проверить миграцию CMS: ${error instanceof Error ? error.message : String(error)}`,
        );
        setMigrationState('error');
      });
  }, [isAdmin, migrationState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (migrationState === 'idle' || migrationState === 'running') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600" />
        <div>
          <p className="font-semibold text-slate-800">Проверяем версию данных CMS…</p>
          <p className="text-sm text-slate-500 mt-1">Полные коллекции читаются только если миграция действительно нужна.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {(migrationState === 'deferred' || migrationState === 'error') && (
        <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-[100] max-w-2xl w-[calc(100%-2rem)] rounded-xl px-4 py-3 text-xs shadow-lg ${
          migrationState === 'deferred'
            ? 'bg-amber-50 border border-amber-200 text-amber-900'
            : 'bg-red-50 border border-red-200 text-red-900'
        }`}>
          <div className="font-black">
            {migrationState === 'deferred' ? 'Firestore quota исчерпана' : 'Проверка миграции CMS не выполнена'}
          </div>
          <div className="mt-1 leading-5">{migrationError}</div>
        </div>
      )}
      <Outlet />
    </>
  );
}
