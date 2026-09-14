import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lead } from '../../types';

type CmsLead = Omit<Lead, 'createdAt' | 'calculatorDetails'> & {
  createdAt?: unknown;
  source?: string;
  question?: string;
  comment?: string;
  contactDetail?: string;
  serviceType?: string;
  desiredDate?: string;
  locationDetails?: string;
  preferredContact?: string;
  eventDate?: string;
  company?: string;
  calculatorDetails?: Record<string, unknown>;
};

function timestampToMs(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    try {
      if (typeof candidate.toDate === 'function') return candidate.toDate().getTime();
    } catch {
      // Fall through to seconds-based representations.
    }
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
    if (typeof candidate._seconds === 'number') return candidate._seconds * 1000;
  }
  return 0;
}

function formatLeadDate(value: unknown): string {
  const ms = timestampToMs(value);
  if (!ms) return '';
  return new Date(ms).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function inferLeadSource(lead: CmsLead): string {
  if (lead.source) return lead.source;
  if (lead.serviceType?.toLowerCase().includes('фото')) return 'photography_booking';
  if (lead.calculatorDetails) return 'video_calculator';
  if (typeof lead.eventType === 'string' && /sports|conference|concert|трансляц|конференц|концерт/i.test(lead.eventType)) {
    return 'live_calculator';
  }
  if (typeof lead.service === 'string' && /construction|будівниц|строитель/i.test(lead.service)) {
    return 'construction_calculator';
  }
  if (typeof lead.eventType === 'string' && /контакт|contact|консультац/i.test(lead.eventType)) {
    return 'contact_form';
  }
  if (Array.isArray(lead.additionalServices)) return 'quick_or_live_form';
  return 'website';
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    photography_booking: 'Фото — бронирование',
    video_calculator: 'Видео — калькулятор',
    live_calculator: 'Live — калькулятор',
    construction_calculator: 'Construction — калькулятор',
    contact_form: 'Контакты',
    home_quick_contact: 'Главная — быстрая форма',
    quick_or_live_form: 'Главная / Live',
    website: 'Сайт',
  };
  return labels[source] || source;
}

function formatCalculatorDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return '';
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : String(value)}`)
    .join('\n');
}

function leadAmount(lead: CmsLead): number | undefined {
  if (typeof lead.calculatedCost === 'number') return lead.calculatedCost;
  if (typeof lead.estimatedCost === 'number') return lead.estimatedCost;
  return undefined;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  contacted: 'Связались',
  in_progress: 'В работе',
  estimate_sent: 'Смета отправлена',
  completed: 'Завершена',
  archived: 'Архив',
};

export function LeadsCRM() {
  const [leads, setLeads] = useState<CmsLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<CmsLead | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'leads'));
      const list = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() } as CmsLead))
        .sort((a, b) => timestampToMs(b.createdAt) - timestampToMs(a.createdAt));
      setLeads(list);
      setSelectedLead(current => current ? list.find(item => item.id === current.id) || null : null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    for (const lead of leads) {
      const status = lead.status || 'new';
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('ru-RU');
    return leads.filter(item => {
      const statusMatches = statusFilter === 'all' || (item.status || 'new') === statusFilter;
      if (!statusMatches) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        item.name,
        item.phone,
        item.email,
        item.company,
        item.service,
        item.serviceType,
        item.eventType,
        item.location,
        item.locationDetails,
        item.message,
        item.comment,
        item.question,
        item.notes,
        sourceLabel(inferLeadSource(item)),
      ].filter(Boolean).join(' ').toLocaleLowerCase('ru-RU');

      return haystack.includes(normalizedSearch);
    });
  }, [leads, searchQuery, statusFilter]);

  const selectLead = (lead: CmsLead) => {
    setSelectedLead(lead);
    setNotesDraft(lead.notes || '');
  };

  const updateStatus = async (leadId: string, status: Lead['status']) => {
    if (!status) return;
    try {
      await updateDoc(doc(db, 'leads', leadId), { status });
      setLeads(current => current.map(item => item.id === leadId ? { ...item, status } : item));
      setSelectedLead(current => current?.id === leadId ? { ...current, status } : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const saveNotes = async () => {
    if (!selectedLead?.id) return;
    setSavingNotes(true);
    setError('');
    try {
      const notes = notesDraft.trim();
      await updateDoc(doc(db, 'leads', selectedLead.id), { notes });
      setLeads(current => current.map(item => item.id === selectedLead.id ? { ...item, notes } : item));
      setSelectedLead(current => current ? { ...current, notes } : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingNotes(false);
    }
  };

  const remove = async (leadId: string) => {
    if (!window.confirm('Удалить эту заявку без возможности восстановления?')) return;
    try {
      await deleteDoc(doc(db, 'leads', leadId));
      setLeads(current => current.filter(item => item.id !== leadId));
      setSelectedLead(current => current?.id === leadId ? null : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const exportCsv = () => {
    const rows = filteredLeads.map(lead => [
      formatLeadDate(lead.createdAt),
      STATUS_LABELS[lead.status || 'new'] || lead.status || 'new',
      sourceLabel(inferLeadSource(lead)),
      lead.name,
      lead.company,
      lead.phone,
      lead.email,
      lead.service || lead.serviceType || '',
      lead.eventType,
      lead.location || lead.locationDetails || '',
      leadAmount(lead) ?? '',
      lead.message || lead.comment || lead.question || '',
      lead.notes || '',
    ]);
    const header = ['Дата', 'Статус', 'Источник', 'Имя', 'Компания', 'Телефон', 'Email', 'Услуга', 'Тип/событие', 'Локация', 'Сумма', 'Сообщение', 'Заметки'];
    const csv = [header, ...rows].map(row => row.map(csvEscape).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dneprfilm-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2"><Inbox className="w-3.5 h-3.5" />CRM</div>
            <h2 className="text-2xl font-black">Заявки со всех страниц сайта</h2>
            <p className="text-sm text-slate-500 mt-1">Числовые даты и Firestore Timestamp поддерживаются одновременно. Поля старых и новых форм нормализуются в одном интерфейсе.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchLeads} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Обновить
            </button>
            <button onClick={exportCsv} disabled={filteredLeads.length === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />CSV ({filteredLeads.length})
            </button>
          </div>
        </div>

        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Поиск: имя, телефон, email, компания, услуга, источник, заметки…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'new', 'contacted', 'in_progress', 'estimate_sent', 'completed', 'archived'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {status === 'all' ? 'Все' : STATUS_LABELS[status]} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка заявок…</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">По текущему фильтру заявок нет.</div>
      ) : (
        <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6 items-start">
          <div className="space-y-3">
            {filteredLeads.map(lead => {
              const status = lead.status || 'new';
              const source = inferLeadSource(lead);
              const amount = leadAmount(lead);
              return (
                <button key={lead.id} type="button" onClick={() => selectLead(lead)} className={`w-full text-left p-5 rounded-2xl border bg-white transition-all ${selectedLead?.id === lead.id ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">{STATUS_LABELS[status] || status}</span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">{sourceLabel(source)}</span>
                        <span className="text-xs text-slate-400">{formatLeadDate(lead.createdAt)}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 truncate">{lead.name || 'Без имени'}</h3>
                      {lead.company && <div className="text-xs text-slate-500 mt-0.5">{lead.company}</div>}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                        {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                      </div>
                      <div className="text-xs text-indigo-700 font-semibold mt-2">{lead.service || lead.serviceType || lead.eventType || 'Обращение с сайта'}</div>
                    </div>
                    {amount !== undefined ? <div className="text-sm font-black text-emerald-700 shrink-0">{amount.toLocaleString()} грн</div> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-24">
            {selectedLead ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black">{selectedLead.name || 'Заявка'}</h3>
                    <p className="text-xs text-slate-400 mt-1">{formatLeadDate(selectedLead.createdAt)} · {sourceLabel(inferLeadSource(selectedLead))}</p>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="p-2 rounded-full hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>

                <label className="block text-xs font-bold mt-5">Статус
                  <select value={selectedLead.status || 'new'} onChange={e => updateStatus(selectedLead.id!, e.target.value as Lead['status'])} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-normal">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                <div className="mt-5 space-y-3 text-sm">
                  {selectedLead.company && <Detail label="Компания" value={selectedLead.company} />}
                  {selectedLead.phone && <Detail label="Телефон" value={selectedLead.phone} href={`tel:${selectedLead.phone.replace(/[^+\d]/g, '')}`} />}
                  {selectedLead.email && <Detail label="Email" value={selectedLead.email} href={`mailto:${selectedLead.email}`} />}
                  {selectedLead.contactDetail && <Detail label="Контакт" value={selectedLead.contactDetail} />}
                  {selectedLead.preferredContact && <Detail label="Предпочтительный канал" value={selectedLead.preferredContact} />}
                  {selectedLead.service && <Detail label="Услуга" value={selectedLead.service} />}
                  {selectedLead.serviceType && <Detail label="Тип услуги" value={selectedLead.serviceType} />}
                  {selectedLead.eventType && <Detail label="Тип / событие" value={selectedLead.eventType} />}
                  {selectedLead.cameraCount && <Detail label="Камеры" value={selectedLead.cameraCount} />}
                  {selectedLead.location && <Detail label="Локация" value={selectedLead.location} />}
                  {selectedLead.locationDetails && <Detail label="Детали локации" value={selectedLead.locationDetails} />}
                  {selectedLead.eventDate && <Detail label="Дата события" value={selectedLead.eventDate} />}
                  {selectedLead.desiredDate && <Detail label="Желаемая дата" value={selectedLead.desiredDate} />}
                  {typeof selectedLead.hasStarlink === 'boolean' && <Detail label="Starlink" value={selectedLead.hasStarlink ? 'Да' : 'Нет'} />}
                  {Array.isArray(selectedLead.additionalServices) && selectedLead.additionalServices.length > 0 && <Detail label="Доп. услуги" value={selectedLead.additionalServices.join('\n')} multiline />}
                  {selectedLead.calculatorDetails && <Detail label="Конфигуратор" value={formatCalculatorDetails(selectedLead.calculatorDetails)} multiline />}
                  {selectedLead.question && <Detail label="Вопрос" value={selectedLead.question} multiline />}
                  {selectedLead.message && <Detail label="Сообщение" value={selectedLead.message} multiline />}
                  {selectedLead.comment && <Detail label="Комментарий" value={selectedLead.comment} multiline />}
                  {typeof selectedLead.calculatedCost === 'number' && <Detail label="Расчёт видео" value={`${selectedLead.calculatedCost.toLocaleString()} грн`} />}
                  {typeof selectedLead.estimatedCost === 'number' && <Detail label="Ориентировочная стоимость" value={`${selectedLead.estimatedCost.toLocaleString()} грн`} />}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">Заметки менеджера</label>
                  <textarea
                    value={notesDraft}
                    onChange={event => setNotesDraft(event.target.value)}
                    rows={4}
                    placeholder="Итог звонка, договорённости, следующий шаг…"
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                  <button onClick={saveNotes} disabled={savingNotes || notesDraft.trim() === (selectedLead.notes || '').trim()} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-sm font-bold disabled:opacity-40">
                    <Save className="w-4 h-4" />{savingNotes ? 'Сохранение…' : 'Сохранить заметку'}
                  </button>
                </div>

                <button onClick={() => remove(selectedLead.id!)} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold"><Trash2 className="w-4 h-4" />Удалить заявку</button>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400"><Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm">Выберите заявку слева, чтобы увидеть все данные.</p></div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, multiline = false, href }: { label: string; value: string; multiline?: boolean; href?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</div>
      {href ? (
        <a href={href} className="mt-0.5 inline-block text-indigo-700 hover:underline break-all">{value}</a>
      ) : (
        <div className={`mt-0.5 text-slate-700 break-words ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>{value}</div>
      )}
    </div>
  );
}
