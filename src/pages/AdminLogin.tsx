import React, { useState } from 'react';
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Video } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';

const ADMIN_EMAIL = 'dneprfilmcom@gmail.com';

export function AdminLogin() {
  const { isUk } = useSiteContent();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const signedInUser = credential.user;
      const signedInEmail = signedInUser.email?.toLowerCase() ?? '';

      if (signedInEmail !== ADMIN_EMAIL) {
        await signOut(auth);
        setError(
          isUk
            ? 'Цей обліковий запис не має прав адміністратора.'
            : 'У этой учетной записи нет прав администратора.',
        );
        return;
      }

      if (!signedInUser.emailVerified) {
        await sendEmailVerification(signedInUser);
        await signOut(auth);
        setNotice(
          isUk
            ? 'На пошту адміністратора надіслано лист підтвердження. Підтвердьте адресу та увійдіть ще раз.'
            : 'На почту администратора отправлено письмо подтверждения. Подтвердите адрес и войдите ещё раз.',
        );
        return;
      }

      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError(
        isUk
          ? 'Помилка входу. Перевірте пошту та пароль.'
          : 'Ошибка входа. Проверьте почту и пароль.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Video className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {isUk ? 'Вхід адміністратора' : 'Вход администратора'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {isUk ? 'Пароль' : 'Пароль'}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {notice && <div className="text-emerald-700 text-sm">{notice}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading
                  ? isUk
                    ? 'Вхід...'
                    : 'Вход...'
                  : isUk
                    ? 'Увійти'
                    : 'Войти'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
