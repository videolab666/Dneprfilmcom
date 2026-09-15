import { AlertTriangle, CheckCircle2, CircleGauge, Info, XCircle } from 'lucide-react';
import type { ContentHealthReport, ContentHealthSeverity } from '../../lib/contentHealth';

interface UnifiedContentHealthPanelProps {
  report: ContentHealthReport;
}

function severityClasses(severity: ContentHealthSeverity): string {
  if (severity === 'error') return 'border-red-200 bg-red-50 text-red-800';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-blue-200 bg-blue-50 text-blue-800';
}

function gradeText(report: ContentHealthReport): string {
  if (report.grade === 'excellent') return 'Отличное состояние';
  if (report.grade === 'good') return 'Хорошее состояние';
  if (report.grade === 'needs-work') return 'Нужно доработать';
  return 'Есть критические проблемы';
}

export function UnifiedContentHealthPanel({ report }: UnifiedContentHealthPanelProps) {
  const errors = report.issues.filter(issue => issue.severity === 'error').length;
  const warnings = report.issues.filter(issue => issue.severity === 'warning').length;
  const info = report.issues.filter(issue => issue.severity === 'info').length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><CircleGauge className="h-4 w-4 text-indigo-600" />Content Health</div>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-black tracking-tight text-slate-950">{report.score}</span>
            <span className="pb-1 text-sm font-bold text-slate-400">/ 100</span>
          </div>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${report.score >= 90 ? 'bg-emerald-100 text-emerald-700' : report.score >= 75 ? 'bg-blue-100 text-blue-700' : report.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{gradeText(report)}</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Проверки текущего материала</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Health объединяет Publish Quality Gate с полнотой локализаций, SEO-длинами, taxonomy, media и связанным контентом. Это диагностический слой; публикационные ошибки по-прежнему блокируются основным Quality Gate.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-red-50 p-4"><div className="text-2xl font-black text-red-700">{errors}</div><div className="text-xs font-bold text-red-600">критических</div></div>
            <div className="rounded-2xl bg-amber-50 p-4"><div className="text-2xl font-black text-amber-800">{warnings}</div><div className="text-xs font-bold text-amber-700">предупреждений</div></div>
            <div className="rounded-2xl bg-blue-50 p-4"><div className="text-2xl font-black text-blue-700">{info}</div><div className="text-xs font-bold text-blue-600">рекомендаций</div></div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-black text-slate-950">Checklist</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.checks.map(check => (
            <div key={check.id} className={`rounded-2xl border p-4 ${check.passed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start gap-3">
                {check.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
                <div><div className="text-sm font-black text-slate-900">{check.label}</div><div className="mt-1 text-xs leading-relaxed text-slate-500">{check.detail}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-950">Что стоит исправить</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{report.issues.length}</span></div>
        {report.issues.length === 0 ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />Дополнительных замечаний нет.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {report.issues.map(issue => {
              const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Info;
              return (
                <div key={issue.id} className={`rounded-2xl border p-4 ${severityClasses(issue.severity)}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black">{issue.title}</span><span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">{issue.area}</span></div><p className="mt-1 text-xs leading-relaxed opacity-80">{issue.detail}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
