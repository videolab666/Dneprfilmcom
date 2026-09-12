import { useEffect, useMemo, useState } from 'react';
import { Calendar, Inbox, Mail, Phone, Trash2, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lead } from '../../types';

type CmsLead = Omit<Lead, 'createdAt'> & {
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
  const [selectedLead, setSelectedLead] = useState<CmsLead | null>(null);
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
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const filteredLeads = useMemo(
    () => statusFilter === 'all' ? leads : leads.filter(item => (item.status || 'new') === statusFilter),
    [leads, statusFilter],
  );

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

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2"><Inbox className="w-3.5 h-3.5" />CRM</div>
          <h2 className="text-2xl font-black">Заявки со всех страниц сайта</h2>
          <p className="text-sm text-slate-500 mt-1">Поддерживаются как числовые даты старых форм, так и Firestore Timestamp новых форм.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'new', 'contacted', 'in_progress', 'estimate_sent', 'completed', 'archived'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {status === 'all' ? `Все (${leads.length})` : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка заявок…</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">Заявок в этой категории пока нет.</div>
      ) : (
        <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6 items-start">
          <div className="space-y-3">
            {filteredLeads.map(lead => {
              const status = lead.status || 'new';
              return (
                <button key={lead.id} type="button" onClick={() => setSelectedLead(lead)} className={`w-full text-left p-5 rounded-2xl border bg-white transition-all ${selectedLead?.id === lead.id ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">{STATUS_LABELS[status] || status}</span>
                        {lead.source && <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">{lead.source}</span>}
                        <span className="text-xs text-slate-400">{formatLeadDate(lead.createdAt)}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 truncate">{lead.name || 'Без имени'}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                        {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                      </div>
                      <div className="text-xs text-indigo-700 font-semibold mt-2">{lead.service || lead.serviceType || lead.eventType || 'Обращение с сайта'}</div>
                    </div>
                    {lead.calculatedCost ? <div className="text-sm font-black text-emerald-700 shrink-0">{lead.calculatedCost.toLocaleString()} грн</div> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-24">
            {selectedLead ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="text-xl font-black">{selectedLead.name || 'Заявка'}</h3><p className="text-xs text-slate-400 mt-1">{formatLeadDate(selectedLead.createdAt)}</p></div>
                  <button onClick={() => setSelectedLead(null)} className="p-2 rounded-full hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>

                <label className="block text-xs font-bold mt-5">Статус
                  <select value={selectedLead.status || 'new'} onChange={e => updateStatus(selectedLead.id!, e.target.value as Lead['status'])} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-normal">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                <div className="mt-5 space-y-3 text-sm">
                  {selectedLead.phone && <Detail label="Телефон" value={selectedLead.phone} />}
                  {selectedLead.email && <Detail label="Email" value={selectedLead.email} />}
                  {selectedLead.contactDetail && <Detail label="Контакт" value={selectedLead.contactDetail} />}
                  {selectedLead.preferredContact && <Detail label="Предпочтительный канал" value={selectedLead.preferredContact} />}
                  {selectedLead.service && <Detail label="Услуга" value={selectedLead.service} />}
                  {selectedLead.serviceType && <Detail label="Тип услуги" value={selectedLead.serviceType} />}
                  {selectedLead.location && <Detail label="Локация" value={selectedLead.location} />}
                  {selectedLead.locationDetails && <Detail label="Детали локации" value={selectedLead.locationDetails} />}
                  {selectedLead.eventDate && <Detail label="Дата события" value={selectedLead.eventDate} />}
                  {selectedLead.desiredDate && <Detail label="Желаемая дата" value={selectedLead.desiredDate} />}
                  {selectedLead.question && <Detail label="Вопрос" value={selectedLead.question} multiline />}
                  {selectedLead.message && <Detail label="Сообщение" value={selectedLead.message} multiline />}
                  {selectedLead.comment && <Detail label="Комментарий" value={selectedLead.comment} multiline />}
                  {selectedLead.notes && <Detail label="Заметки" value={selectedLead.notes} multiline />}
                  {selectedLead.calculatedCost ? <Detail label="Расчет" value={`${selectedLead.calculatedCost.toLocaleString()} грн`} /> : null}
                </div>

                <button onClick={() => remove(selectedLead.id!)} className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold"><Trash2 className="w-4 h-4" />Удалить заявку</button>
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

function Detail({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return <div><div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</div><div className={`mt-0.5 text-slate-700 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>{value}</div></div>;
}
