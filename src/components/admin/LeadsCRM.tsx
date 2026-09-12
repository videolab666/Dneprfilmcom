import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ChevronRight, 
  X, 
  Filter 
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lead } from '../../types';

export function LeadsCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'leads'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
      setLeads(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: Lead['status']) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { status });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (window.confirm('Удалить эту заявку?')) {
      await deleteDoc(doc(db, 'leads', leadId));
      setLeads(leads.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    }
  };

  const filteredLeads = statusFilter === 'all' 
    ? leads 
    : leads.filter(l => (l.status || 'new') === statusFilter);

  const statusBadges: Record<string, { label: string; color: string }> = {
    new: { label: 'Новая', color: 'bg-indigo-100 text-indigo-800' },
    in_progress: { label: 'В работе', color: 'bg-amber-100 text-amber-800' },
    estimate_sent: { label: 'Смета отправлена', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Завершена', color: 'bg-emerald-100 text-emerald-800' },
    archived: { label: 'Архив', color: 'bg-slate-100 text-slate-600' }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Inbox className="w-3.5 h-3.5" />
            <span>Входящие заявки</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            CRM: Лиды и расчеты калькулятора
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Все обращения клиентов с калькулятора LIVE Production, формы заказа звонка и быстрого контакта.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
          {['all', 'new', 'in_progress', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === f
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'all' ? `Все (${leads.length})` : statusBadges[f]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads content */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка заявок...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800 mb-1">Заявок пока нет</h4>
          <p className="text-sm text-slate-500">Как только клиент заполнит форму или калькулятор на сайте, заявка появится здесь.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredLeads.map((lead) => {
              const currentStatus = lead.status || 'new';
              const badge = statusBadges[currentStatus] || statusBadges.new;

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedLead?.id === lead.id
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                      {lead.calculatedCost && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {lead.calculatedCost.toLocaleString()} грн
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{lead.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      {lead.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1 text-slate-400" /> {lead.phone}</span>}
                      {lead.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1 text-slate-400" /> {lead.email}</span>}
                    </div>

                    {lead.service && (
                      <p className="text-xs text-indigo-700 font-semibold mt-1">
                        Услуга: {lead.service}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(lead.id, e.target.value as any);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="new">Новая</option>
                      <option value="in_progress">В работе</option>
                      <option value="estimate_sent">Смета отправлена</option>
                      <option value="completed">Завершена</option>
                      <option value="archived">Архив</option>
                    </select>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lead.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Sidebar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-24">
            {selectedLead ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Карточка клиента
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedLead.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contacts */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Контакты</div>
                  <div className="flex items-center space-x-2 text-sm text-slate-800">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <a href={`tel:${selectedLead.phone}`} className="font-bold hover:underline">
                      {selectedLead.phone}
                    </a>
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center space-x-2 text-sm text-slate-800">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      <a href={`mailto:${selectedLead.email}`} className="hover:underline">
                        {selectedLead.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Estimate details if from calculator */}
                {selectedLead.calculatedCost && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      Расчет калькулятора LIVE
                    </div>
                    <div className="text-2xl font-black text-indigo-600">
                      {selectedLead.calculatedCost.toLocaleString()} грн
                    </div>
                    {selectedLead.calculatorDetails && (
                      <div className="text-xs space-y-1 text-slate-700 pt-2 border-t border-indigo-200/50">
                        <div>Камер: <b>{selectedLead.calculatorDetails.cameras}</b></div>
                        <div>Дней: <b>{selectedLead.calculatorDetails.days}</b></div>
                        <div>Starlink: <b>{selectedLead.calculatorDetails.starlink ? 'Да' : 'Нет'}</b></div>
                        <div>Повторы Slow Motion: <b>{selectedLead.calculatorDetails.slowMotion ? 'Да' : 'Нет'}</b></div>
                        <div>Дрон: <b>{selectedLead.calculatorDetails.drone ? 'Да' : 'Нет'}</b></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                {selectedLead.message && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Сообщение / Пожелания
                    </div>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                      {selectedLead.message}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Позвонить клиенту</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Выберите заявку из списка слева для просмотра деталей и расчета</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
