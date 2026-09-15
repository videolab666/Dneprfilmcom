import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CircleGauge,
  ExternalLink,
  FileText,
  Film,
  Images,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  loadCmsDiagnostics,
  type CmsDiagnosticsReport,
  type ContentHealthEntity,
  type DiagnosticIssue,
  type SecurityProbeCheck,
} from '../../lib/cmsDiagnostics';
import {
  applyDiagnosticSafeFix,
  diagnosticSafeFix,
} from '../../lib/cmsDiagnosticFixes';
import type { ContentHealthIssue } from '../../lib/contentHealth';
import type { PublishQualityType } from '../../lib/publishQuality';

type ContentTarget = { type: PublishQualityType; id: string };
type OpenContentHandler = (target?: ContentTarget) => void;

interface CmsDiagnosticsProps {
  onOpenContent?: OpenContentHandler;
}

type SeverityFilter = 'all' | 'error' | 'warning' | 'info';
type StatusFilter = 'all' | 'published' | 'draft';

const TYPE_META: Record<PublishQualityType, { label: string; icon: typeof Briefcase }> = {
  case: { label: 'Cases', icon: Briefcase },
  gallery: { label: 'Galleries', icon: Images },
  video: { label: 'Videos', icon: Film },
  article: { label: 'Articles', icon: FileText },
};

function formatDate(value?: number): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function scoreTone(score: number): string {
  if (score >= 90) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (score >= 75) return 'border-blue-200 bg-blue-50 text-blue-800';
  if (score >= 50) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-red-200 bg-red-50 text-red-800';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Critical';
}

function severityTone(severity: 'error' | 'warning' | 'info'): string {
  return severity === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : severity === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-blue-200 bg-blue-50 text-blue-700';
}

function CountCard({ title, total, published, draft, score }: {
  title: string;
  total: number;
  published: number;
  draft: number;
  score?: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
        {typeof score === 'number' && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${scoreTone(score)}`}>{score}/100</span>}
      </div>
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
          <p className="mt-1 text-xs text-slate-600">Ожидание: <span className="font-semibold">{check.expected === 'allow' ? 'разрешено' : 'запрещено'}</span>. {check.detail}</p>
        </div>
      </div>
    </div>
  );
}

function DiagnosticIssueRow({
  issue,
  onOpenContent,
  onSafeFix,
  fixingIssueId,
}: {
  issue: DiagnosticIssue;
  onOpenContent?: OpenContentHandler;
  onSafeFix?: (issue: DiagnosticIssue) => void;
  fixingIssueId?: string | null;
  key?: string;
}) {
  const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Activity;
  const safeFix = diagnosticSafeFix(issue);
  const exactTarget = issue.entityType && issue.entityId ? { type: issue.entityType, id: issue.entityId } : null;
  const fixing = fixingIssueId === issue.id;

  return (
    <div className={`rounded-xl border px-4 py-3 ${severityTone(issue.severity)}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{issue.title}</p>
          <p className="mt-1 break-words text-xs opacity-80">{issue.detail}</p>
          {(issue.entityId || issue.publicPath || safeFix) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
              {issue.entityId && <span className="rounded-md bg-white/70 px-2 py-1">ID: {issue.entityId}</span>}
              {issue.publicPath && <Link to={issue.publicPath} target="_blank" className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 hover:bg-white"><ExternalLink className="h-3 w-3" />Public</Link>}
              {exactTarget && onOpenContent && (
                <button type="button" onClick={() => onOpenContent(exactTarget)} className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 hover:bg-white">
                  Unified Editor <ArrowRight className="h-3 w-3" />
                </button>
              )}
              {safeFix && onSafeFix && (
                <button type="button" disabled={Boolean(fixingIssueId)} onClick={() => onSafeFix(issue)} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700 disabled:opacity-50">
                  <Wrench className={`h-3 w-3 ${fixing ? 'animate-pulse' : ''}`} />{fixing ? 'Исправление…' : safeFix.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssuesSection({
  title,
  items,
  emptyText,
  onOpenContent,
  onSafeFix,
  fixingIssueId,
}: {
  title: string;
  items: DiagnosticIssue[];
  emptyText: string;
  onOpenContent?: OpenContentHandler;
  onSafeFix?: (issue: DiagnosticIssue) => void;
  fixingIssueId?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${items.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />{emptyText}</div>
      ) : (
        <div className="max-h-[34rem] space-y-2 overflow-auto pr-1">
          {items.map(issue => <DiagnosticIssueRow key={issue.id} issue={issue} onOpenContent={onOpenContent} onSafeFix={onSafeFix} fixingIssueId={fixingIssueId} />)}
        </div>
      )}
    </section>
  );
}

function HealthIssueRow({ issue }: { issue: ContentHealthIssue; key?: string }) {
  const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Info;
  return (
    <div className={`rounded-lg border px-3 py-2 ${severityTone(issue.severity)}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black">{issue.title}</span><span className="rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">{issue.area}</span></div>
          <p className="mt-0.5 text-[11px] opacity-80">{issue.detail}</p>
        </div>
      </div>
    </div>
  );
}

function HealthEntityCard({ item, onOpenContent }: { item: ContentHealthEntity; onOpenContent?: OpenContentHandler; key?: string }) {
  const Icon = TYPE_META[item.type].icon;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{TYPE_META[item.type].label}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${item.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.published ? 'LIVE' : 'DRAFT'}</span></div>
          <h4 className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{item.title}</h4>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">{item.slug}</p>
        </div>
        <div className={`shrink-0 rounded-xl border px-3 py-2 text-center ${scoreTone(item.score)}`}><div className="text-xl font-black leading-none">{item.score}</div><div className="mt-1 text-[9px] font-black uppercase">{scoreLabel(item.score)}</div></div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
        {item.errors > 0 && <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Errors {item.errors}</span>}
        {item.warnings > 0 && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Warnings {item.warnings}</span>}
        {item.infos > 0 && <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">Info {item.infos}</span>}
        {item.issues.length === 0 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Без замечаний</span>}
      </div>

      {item.issues.length > 0 && <div className="mt-3 space-y-1.5">{item.issues.slice(0, 4).map(issue => <HealthIssueRow key={issue.id} issue={issue} />)}{item.issues.length > 4 && <div className="px-1 text-[10px] font-bold text-slate-400">Ещё замечаний: {item.issues.length - 4}</div>}</div>}

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        {onOpenContent && <button type="button" onClick={() => onOpenContent({ type: item.type, id: item.id })} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white hover:bg-indigo-600">Открыть в редакторе <ArrowRight className="h-3.5 w-3.5" /></button>}
        {item.published && <Link to={item.publicPath} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-700"><ExternalLink className="h-3.5 w-3.5" />Public</Link>}
        <span className="ml-auto truncate text-[10px] text-slate-400" title={item.id}>{item.id}</span>
      </div>
    </article>
  );
}

export function CmsDiagnostics({ onOpenContent }: CmsDiagnosticsProps = {}) {
  const [report, setReport] = useState<CmsDiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fixMessage, setFixMessage] = useState('');
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | PublishQualityType>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [queryText, setQueryText] = useState('');

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

  useEffect(() => { void load(); }, []);

  const applySafeFix = async (issue: DiagnosticIssue) => {
    const fix = diagnosticSafeFix(issue);
    if (!fix || fixingIssueId) return;
    if (!window.confirm(fix.confirm)) return;
    setFixingIssueId(issue.id);
    setFixMessage('');
    setError('');
    try {
      const message = await applyDiagnosticSafeFix(issue);
      setFixMessage(message);
      await load();
    } catch (fixError) {
      console.error('CMS safe fix failed:', fixError);
      setError(fixError instanceof Error ? fixError.message : String(fixError));
    } finally {
      setFixingIssueId(null);
    }
  };

  const filteredHealth = useMemo(() => {
    if (!report) return [];
    const q = queryText.trim().toLowerCase();
    return report.health.items.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter === 'published' && !item.published) return false;
      if (statusFilter === 'draft' && item.published) return false;
      if (severityFilter !== 'all' && !item.issues.some(issue => issue.severity === severityFilter)) return false;
      if (q && !`${item.title} ${item.slug} ${item.id} ${item.issues.map(issue => `${issue.title} ${issue.detail}`).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [report, queryText, typeFilter, severityFilter, statusFilter]);

  const problemCount = useMemo(() => {
    if (!report) return 0;
    const failedSecurity = report.security.checks.filter(check => !check.passed).length;
    return report.health.errors + report.health.warnings + report.contentIssues.length + failedSecurity + report.media.duplicateRegistryUrls;
  }, [report]);

  if (loading && !report) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><RefreshCw className="mx-auto h-7 w-7 animate-spin text-indigo-600" /><p className="mt-3 text-sm font-semibold text-slate-700">Проверяем Firestore, Content Health, связи и медиатеку…</p></div>;

  if (error && !report) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><div className="flex items-start gap-3"><XCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Диагностика не запустилась</p><p className="mt-1 text-sm">{error}</p><button onClick={() => void load()} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800">Повторить</button></div></div></div>;

  if (!report) return null;
  const securityOk = report.security.status === 'ok';
  const migrationOk = report.migration.version >= 1;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700"><CircleGauge className="h-3.5 w-3.5" />Content Health Dashboard 2.1</div><h2 className="mt-2 text-2xl font-black text-slate-950">Состояние CMS</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">Единая проверка Cases / Galleries / Videos / Articles с точным переходом в Unified Editor и безопасными механическими исправлениями.</p><p className="mt-2 text-xs text-slate-400">Последняя проверка: {formatDate(report.generatedAt)}</p></div>
          <div className="flex flex-wrap gap-2">{onOpenContent && <button type="button" onClick={() => onOpenContent()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700 hover:bg-indigo-100">Unified Editor <ArrowRight className="h-4 w-4" /></button>}<button onClick={() => void load()} disabled={loading || Boolean(fixingIssueId)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Проверить заново</button></div>
        </div>
      </section>

      {fixMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{fixMessage}</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Последняя операция завершилась с ошибкой: {error}. Ниже показан последний успешный отчёт.</div>}

      <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className={`rounded-3xl border p-6 shadow-sm ${scoreTone(report.health.score)}`}><div className="text-xs font-black uppercase tracking-[0.16em] opacity-70">Overall health</div><div className="mt-3 flex items-end gap-2"><span className="text-6xl font-black leading-none">{report.health.score}</span><span className="pb-1 text-sm font-black opacity-60">/100</span></div><div className="mt-2 text-sm font-black">{scoreLabel(report.health.score)}</div><div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs font-bold"><div className="rounded-xl bg-white/60 p-2"><div className="text-lg font-black text-red-700">{report.health.errors}</div><div className="opacity-60">errors</div></div><div className="rounded-xl bg-white/60 p-2"><div className="text-lg font-black text-amber-700">{report.health.warnings}</div><div className="opacity-60">warnings</div></div><div className="rounded-xl bg-white/60 p-2"><div className="text-lg font-black text-emerald-700">{report.health.excellent}</div><div className="opacity-60">excellent</div></div><div className="rounded-xl bg-white/60 p-2"><div className="text-lg font-black">{report.health.critical}</div><div className="opacity-60">critical</div></div></div></div>
        <div className={`rounded-3xl border p-6 ${problemCount === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><div className="flex items-start gap-3">{problemCount === 0 ? <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" /> : <TriangleAlert className="mt-0.5 h-6 w-6 text-amber-600" />}<div><p className="font-black text-slate-900">{problemCount === 0 ? 'Контент и инфраструктура без критических замечаний' : `Требуют внимания: ${problemCount} сигналов`}</p><p className="mt-1 text-sm text-slate-600">Автоисправления доступны только для однозначных структурных операций. Контент, SEO, taxonomy и publish status меняются только вручную через редактор.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-white/70 p-3"><div className="text-2xl font-black text-slate-900">{report.health.total}</div><div className="text-xs text-slate-500">материалов</div></div><div className="rounded-xl bg-white/70 p-3"><div className="text-2xl font-black text-emerald-700">{report.health.excellent + report.health.good}</div><div className="text-xs text-slate-500">healthy / good</div></div><div className="rounded-xl bg-white/70 p-3"><div className="text-2xl font-black text-amber-700">{report.health.needsWork}</div><div className="text-xs text-slate-500">needs work</div></div><div className="rounded-xl bg-white/70 p-3"><div className="text-2xl font-black text-blue-700">{report.health.infos}</div><div className="text-xs text-slate-500">recommendations</div></div></div></div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><CountCard title="Cases" {...report.counts.cases} score={report.health.byType.case.score} /><CountCard title="Galleries" {...report.counts.galleries} score={report.health.byType.gallery.score} /><CountCard title="Video Projects" {...report.counts.videos} score={report.health.byType.video.score} /><CountCard title="Articles" {...report.counts.articles} score={report.health.byType.article.score} /></div>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={queryText} onChange={event => setQueryText(event.target.value)} placeholder="Поиск по названию, slug, ID или проблеме…" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></div><div className="flex flex-wrap gap-2"><select value={typeFilter} onChange={event => setTypeFilter(event.target.value as 'all' | PublishQualityType)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"><option value="all">Все типы</option><option value="case">Cases</option><option value="gallery">Galleries</option><option value="video">Videos</option><option value="article">Articles</option></select><select value={severityFilter} onChange={event => setSeverityFilter(event.target.value as SeverityFilter)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"><option value="all">Все severity</option><option value="error">Errors</option><option value="warning">Warnings</option><option value="info">Info</option></select><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"><option value="all">Published + Draft</option><option value="published">Published</option><option value="draft">Draft</option></select></div></div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Показано: <strong className="text-slate-900">{filteredHealth.length}</strong> из {report.health.total}</span><span>Сначала показываются материалы с худшим health-score.</span></div>
      </section>

      {filteredHealth.length === 0 ? <div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50 p-10 text-center text-sm font-bold text-emerald-800">По выбранным фильтрам проблемных материалов нет.</div> : <div className="grid gap-4 lg:grid-cols-2">{filteredHealth.map(item => <HealthEntityCard key={item.key} item={item} onOpenContent={onOpenContent} />)}</div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <IssuesSection title="Дубли slug / title" items={report.duplicateIssues} emptyText="Дубли slug/title не найдены." onOpenContent={onOpenContent} onSafeFix={applySafeFix} fixingIssueId={fixingIssueId} />
        <IssuesSection title={`Связи portfolio + articles · ${report.counts.relations}`} items={report.relationIssues} emptyText="Portfolio и Article relations консистентны." onOpenContent={onOpenContent} onSafeFix={applySafeFix} fixingIssueId={fixingIssueId} />
        <IssuesSection title="Структурные media-поля" items={report.contentIssues} emptyText="Пустые media-элементы не найдены." onOpenContent={onOpenContent} onSafeFix={applySafeFix} fixingIssueId={fixingIssueId} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">Media Library</h3><p className="mt-1 text-xs text-slate-500">Реестр и фактические Cloudinary-ссылки, найденные в контенте CMS.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{report.media.total} файлов</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-black">{report.media.registered}</div><div className="text-xs text-slate-500">в реестре</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-black">{report.media.used}</div><div className="text-xs text-slate-500">используются</div></div><div className="rounded-xl bg-amber-50 p-3"><div className="text-xl font-black text-amber-800">{report.media.unusedRegistered}</div><div className="text-xs text-amber-700">orphan candidates</div></div><div className="rounded-xl bg-blue-50 p-3"><div className="text-xl font-black text-blue-800">{report.media.unregisteredReferenced}</div><div className="text-xs text-blue-700">ссылки вне реестра</div></div><div className="rounded-xl bg-red-50 p-3"><div className="text-xl font-black text-red-800">{report.media.duplicateRegistryUrls}</div><div className="text-xs text-red-700">дубли URL</div></div></div>
        {(report.media.orphanAssets.length > 0 || report.media.unregisteredAssets.length > 0) && <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-black text-amber-900">Orphan candidates</p><p className="mt-1 text-xs text-amber-700">Запись есть в медиатеке, но usage scanner не нашёл использование.</p><div className="mt-3 max-h-56 space-y-2 overflow-auto">{report.media.orphanAssets.slice(0, 50).map(asset => <div key={asset.id} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-700"><div className="truncate font-semibold">{asset.name || asset.id}</div><div className="mt-0.5 truncate text-slate-400">{asset.publicId || asset.url}</div></div>)}</div></div><div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm font-black text-blue-900">Используются, но не зарегистрированы</p><p className="mt-1 text-xs text-blue-700">Cloudinary URL найден в CMS, однако media_asset записи нет.</p><div className="mt-3 max-h-56 space-y-2 overflow-auto">{report.media.unregisteredAssets.slice(0, 50).map(asset => <div key={asset.id} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-700"><div className="truncate font-semibold">{asset.name || asset.id}</div><div className="mt-0.5 text-slate-500">использований: {asset.useCount}</div></div>)}</div></div></div>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2">{migrationOk ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}<h3 className="font-black text-slate-900">Миграция portfolio</h3></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Версия</p><p className="mt-1 font-black text-slate-900">v{report.migration.version}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Дата миграции</p><p className="mt-1 font-bold text-slate-900">{formatDate(report.migration.migratedAt)}</p></div></div><div className="mt-4 rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Legacy source сохранён</p><div className="mt-3 grid grid-cols-3 gap-3 text-center"><div><div className="text-xl font-black">{report.migration.legacyVideoWorks}</div><div className="text-[11px] text-slate-500">video works</div></div><div><div className="text-xl font-black">{report.migration.legacyPhotoItems}</div><div className="text-[11px] text-slate-500">photo items</div></div><div><div className="text-xl font-black">{report.migration.legacyConstructionWorks}</div><div className="text-[11px] text-slate-500">construction</div></div></div></div></section>
        <section className={`rounded-2xl border p-5 shadow-sm ${securityOk ? 'border-emerald-200 bg-white' : 'border-red-200 bg-red-50'}`}><div className="flex items-center gap-2">{securityOk ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldX className="h-5 w-5 text-red-600" />}<h3 className="font-black text-slate-900">Firestore public security probe</h3></div><p className="mt-1 text-xs text-slate-500">Проверка выполняется отдельным Firebase app без авторизации, включая published/draft Articles.</p><div className="mt-4 max-h-[34rem] space-y-2 overflow-auto pr-1">{report.security.checks.map(check => <SecurityCheck key={check.id} check={check} />)}</div></section>
      </div>
    </div>
  );
}
