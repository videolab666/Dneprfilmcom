import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ensureCmsSeedData } from '../lib/cmsMigration';

const ADMIN_EMAIL = 'dneprfilmcom@gmail.com';

type MigrationState = 'idle' | 'running' | 'done' | 'error';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const [migrationState, setMigrationState] = useState<MigrationState>('idle');
  const [migrationError, setMigrationError] = useState('');

  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;

  useEffect(() => {
    if (!isAdmin || migrationState !== 'idle') return;

    setMigrationState('running');
    ensureCmsSeedData()
      .then(result => {
        const changed = Object.values(result).reduce((sum, count) => sum + count, 0);
        if (changed > 0) {
          console.info('CMS seed migration completed:', result);
        }
        setMigrationState('done');
      })
      .catch(error => {
        console.error('CMS seed migration failed:', error);
        setMigrationError(error instanceof Error ? error.message : String(error));
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
          <p className="font-semibold text-slate-800">Проверяем данные CMS…</p>
          <p className="text-sm text-slate-500 mt-1">Существующие данные не перезаписываются.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {migrationState === 'error' && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] max-w-2xl w-[calc(100%-2rem)] rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 shadow-lg">
          Автоматическая миграция CMS не выполнена. Проверьте Firestore Rules и подключение к базе. {migrationError}
        </div>
      )}
      <Outlet />
    </>
  );
}
