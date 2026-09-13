import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import {
  loadCmsDiagnostics,
  type CmsDiagnosticsReport,
  type DiagnosticIssue,
  type SecurityProbeCheck,
} from '../../lib/cmsDiagnostics';

function formatDate(value?: number): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function CountCard({
  title,
  total,
  published,
  draft,
}: {
  title: string;
  total: number;
  published: number;
  draft: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-3xl font-black text-slate-900">{total}</span>
        <span className="pb-1 text-xs text-emerald-700">published {published}</span>
        <span className="pb-1 text-xs text-amber-700">draft {draft}</span>
      </div>
    </div>
  );
}

function SecurityCheck({ check }: { check: SecurityProbeCheck; key?: string }) {
  const Icon = check.passed ? CheckCircle2 : XCircle;
  return (
    <div className={`rounded-xl border px-4 py-3 ${check.passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${check.passed ? 'text-emerald-600' : 'text-red-600'}`} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{check.label}</p>
          <p className="mt-1 text-xs text-slate-600">
            Ожидание: <span className="font-semibold">{check.expected === 'allow' ? 'разрешено' : 'запрещено'}</span>. {check.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: DiagnosticIssue; key?: string }) {
  const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Activity;
  const styles = issue.severity === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : issue.severity === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold">{issue.title}</p>
          <p className="mt-1 break-words text-xs opacity-80">{issue.detail}</p>
        </div>
      </div>
    </div>
  );
}

function IssuesSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: DiagnosticIssue[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${items.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(issue => <IssueRow key={issue.id} issue={issue} />)}
        </div>
      )}
    </section>
  );
}

export function CmsDiagnostics() {
  const [report, setReport] = useState<CmsDiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await loadCmsDiagnostics());
    } catch (loadError) {
      console.error('CMS diagnostics failed:', loadError);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const problemCount = useMemo(() => {
    if (!report) return 0;
    const failedSecurity = report.security.checks.filter(check => !check.passed).length;
    return report.duplicateIssues.length
      + report.relationIssues.length
      + report.contentIssues.length
      + failedSecurity
      + report.media.duplicateRegistryUrls;
  }, [report]);

  if (loading && !report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <RefreshCw className="mx-auto h-7 w-7 animate-spin text-indigo-600" />
        <p className="mt-3 text-sm font-semibold text-slate-700">Проверяем Firestore, связи и медиатеку…</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Диагностика не запустилась</p>
            <p className="mt-1 text-sm">{error}</p>
            <button onClick={() => void load()} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800">
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const securityOk = report.security.status === 'ok';
  const migrationOk = report.migration.version >= 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900">Состояние CMS / Диагностика</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Проверка production-данных Firestore, миграции, публикаций, связей и Media Library.
          </p>
          <p className="mt-1 text-xs text-slate-400">Последняя проверка: {formatDate(report.generatedAt)}</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Проверить заново
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Последнее обновление завершилось с ошибкой: {error}. Ниже показан предыдущий успешный отчёт.
        </div>
      )}

      <div className={`rounded-2xl border p-5 ${problemCount === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          {problemCount === 0
            ? <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
            : <TriangleAlert className="mt-0.5 h-6 w-6 text-amber-600" />}
          <div>
            <p className="font-black text-slate-900">
              {problemCount === 0 ? 'Критических проблем не обнаружено' : `Найдено замечаний: ${problemCount}`}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Orphan-файлы считаются отдельно и сами по себе не означают ошибку — это кандидаты на последующую очистку.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <CountCard title="Cases" {...report.counts.cases} />
        <CountCard title="Galleries" {...report.counts.galleries} />
        <CountCard title="Video Projects" {...report.counts.videos} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            {migrationOk ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
            <h3 className="font-black text-slate-900">Миграция portfolio</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Версия</p>
              <p className="mt-1 font-black text-slate-900">v{report.migration.version}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Дата миграции</p>
              <p className="mt-1 font-bold text-slate-900">{formatDate(report.migration.migratedAt)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Legacy source сохранён</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><div className="text-xl font-black">{report.migration.legacyVideoWorks}</div><div className="text-[11px] text-slate-500">video works</div></div>
              <div><div className="text-xl font-black">{report.migration.legacyPhotoItems}</div><div className="text-[11px] text-slate-500">photo items</div></div>
              <div><div className="text-xl font-black">{report.migration.legacyConstructionWorks}</div><div className="text-[11px] text-slate-500">construction</div></div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Legacy-источник специально не удаляется: миграция должна быть обратимо проверяемой и повторный запуск не создаёт дубли.</p>
        </section>

        <section className={`rounded-2xl border p-5 shadow-sm ${securityOk ? 'border-emerald-200 bg-white' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2">
            {securityOk ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldX className="h-5 w-5 text-red-600" />}
            <h3 className="font-black text-slate-900">Firestore public security probe</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">Проверка выполняется отдельным Firebase app без авторизации, то есть реально как анонимный посетитель.</p>
          <div className="mt-4 space-y-2">
            {report.security.checks.map(check => <SecurityCheck key={check.id} check={check} />)}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900">Media Library</h3>
            <p className="mt-1 text-xs text-slate-500">Реестр и фактические Cloudinary-ссылки, найденные в контенте CMS.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{report.media.total} файлов</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-black">{report.media.registered}</div><div className="text-xs text-slate-500">в реестре</div></div>
          <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-black">{report.media.used}</div><div className="text-xs text-slate-500">используются</div></div>
          <div className="rounded-xl bg-amber-50 p-3"><div className="text-xl font-black text-amber-800">{report.media.unusedRegistered}</div><div className="text-xs text-amber-700">orphan candidates</div></div>
          <div className="rounded-xl bg-blue-50 p-3"><div className="text-xl font-black text-blue-800">{report.media.unregisteredReferenced}</div><div className="text-xs text-blue-700">ссылки вне реестра</div></div>
          <div className="rounded-xl bg-red-50 p-3"><div className="text-xl font-black text-red-800">{report.media.duplicateRegistryUrls}</div><div className="text-xs text-red-700">дубли URL в реестре</div></div>
        </div>

        {(report.media.orphanAssets.length > 0 || report.media.unregisteredAssets.length > 0) && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">Orphan candidates</p>
              <p className="mt-1 text-xs text-amber-700">Запись есть в медиатеке, но usage scanner не нашёл использование.</p>
              <div className="mt-3 max-h-56 space-y-2 overflow-auto">
                {report.media.orphanAssets.slice(0, 50).map(asset => (
                  <div key={asset.id} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-700">
                    <div className="truncate font-semibold">{asset.name || asset.id}</div>
                    <div className="mt-0.5 truncate text-slate-400">{asset.publicId || asset.url}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-black text-blue-900">Используются, но не зарегистрированы</p>
              <p className="mt-1 text-xs text-blue-700">Cloudinary URL найден в CMS, однако отдельной media_asset записи нет.</p>
              <div className="mt-3 max-h-56 space-y-2 overflow-auto">
                {report.media.unregisteredAssets.slice(0, 50).map(asset => (
                  <div key={asset.id} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-700">
                    <div className="truncate font-semibold">{asset.name || asset.id}</div>
                    <div className="mt-0.5 text-slate-500">использований: {asset.useCount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <IssuesSection title="Дубли slug / title" items={report.duplicateIssues} emptyText="Дубли slug/title не найдены." />
        <IssuesSection title={`Связи портфолио · ${report.counts.relations}`} items={report.relationIssues} emptyText="Ссылки Case ↔ Gallery ↔ Video консистентны." />
        <IssuesSection title="Контент / media fields" items={report.contentIssues} emptyText="Пустые обязательные media-поля не найдены." />
      </div>
    </div>
  );
}
