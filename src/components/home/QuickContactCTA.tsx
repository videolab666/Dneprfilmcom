import React, { useState } from 'react';
import { Send, CheckCircle2, Phone, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSiteContent } from '../../context/SiteContentContext';

export function QuickContactCTA() {
  const { isUk, settings } = useSiteContent();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [direction, setDirection] = useState('LIVE');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name,
        phone,
        eventType: `${isUk ? 'Головна' : 'Главная'}: ${isUk ? 'Консультація' : 'Консультация'} (${direction})`,
        cameraCount: isUk ? 'За узгодженням' : 'По согласованию',
        location: isUk ? 'Україна (уточнюється)' : 'Украина (уточняется)',
        hasStarlink: false,
        additionalServices: [direction],
        message: comment,
        createdAt: Date.now()
      });
      setIsSuccess(true);
      setName('');
      setPhone('');
      setComment('');
    } catch (err) {
      console.error('Error submitting quick lead:', err);
      alert(isUk ? 'Помилка під час відправки заявки. Будь ласка, зателефонуйте нам напряму.' : 'Ошибка при отправке заявки. Пожалуйста, позвоните нам напрямую.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactPhone = settings?.phone || '+38 (067) 560-00-00';

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden" id="contact-cta">
      {/* Subtle backdrop lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isUk ? 'Швидкий старт проєкту' : 'Быстрый старт проекта'}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {isUk ? 'Отримайте розрахунок кошторису та концепцію за 15 хвилин' : 'Получите расчет сметы и концепцию за 15 минут'}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                {isUk ? (
                  <>
                    Розкажіть про ваше завдання. Засновник студії <strong className="text-white font-medium">Олександр Пітель</strong> або провідний інженер зв'яжуться з вами, щоб запропонувати оптимальний склад групи та обладнання без переплат.
                  </>
                ) : (
                  <>
                    Расскажите о вашей задаче. Основатель студии <strong className="text-white font-medium">Александр Питель</strong> или ведущий инженер свяжутся с вами, чтобы предложить оптимальный состав группы и оборудования без переплат.
                  </>
                )}
              </p>

              <div className="space-y-4 pt-4 text-xs sm:text-sm text-slate-400">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{isUk ? 'Відповідь протягом 15 хвилин у робочий час' : 'Ответ в течение 15 минут в рабочее время'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUk ? 'Фіксований кошторис та конфіденційність за NDA' : 'Фиксированная смета и конфиденциальность по NDA'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    {isUk ? 'Прямий телефонний зв\'язок: ' : 'Прямая телефонная связь: '}
                    <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="text-white font-semibold hover:underline">
                      {contactPhone}
                    </a>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-6 bg-slate-950/60 p-6 sm:p-8 rounded-2xl border border-slate-800">
              {isSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {isUk ? 'Заявку успішно прийнято!' : 'Заявка успешно принята!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                    {isUk
                      ? 'Ми вже аналізуємо параметри вашого проєкту і зателефонуємо вам протягом 15 хвилин.'
                      : 'Мы уже анализируем параметры вашего проекта и перезвоним вам в течение 15 минут.'}
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    {isUk ? 'Надіслати ще один запит' : 'Отправить еще один запрос'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isUk ? 'Ваше ім\'я або компанія *' : 'Ваше имя или компания *'}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={isUk ? 'Наприклад: Артем / Event Agency' : 'Например: Артем / Event Agency'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isUk ? 'Телефон (Telegram / WhatsApp) *' : 'Телефон (Telegram / WhatsApp) *'}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+38 (0__) ___-__-__"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isUk ? 'Напрямок, що цікавить' : 'Интересующее направление'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'LIVE', label: isUk ? 'LIVE Стрім' : 'LIVE Стрим' },
                        { id: 'VIDEO', label: isUk ? 'Відео' : 'Видео' },
                        { id: 'CONSTRUCTION', label: isUk ? 'Будівництво / 3D' : 'Стройка / 3D' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDirection(item.id)}
                          className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                            direction === item.id
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isUk ? 'Короткий опис завдання або дата (за бажанням)' : 'Краткое описание задачи или дата (по желанию)'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={isUk ? 'Наприклад: Турнір з дзюдо 14 жовтня, потрібно 4 камери та повтори...' : 'Например: Турнир по дзюдо 14 октября, нужно 4 камеры и повторы...'}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>
                      {isSubmitting 
                        ? (isUk ? 'Відправка...' : 'Отправка...') 
                        : (isUk ? 'Отримати розрахунок та консультацію' : 'Получить расчет и консультацию')}
                    </span>
                    <Send className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-slate-500 text-center">
                    {isUk
                      ? 'Натискаючи кнопку, ви погоджуєтеся на обробку контактних даних для зв\'язку.'
                      : 'Нажимая кнопку, вы соглашаетесь на обработку контактных данных для связи.'}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
