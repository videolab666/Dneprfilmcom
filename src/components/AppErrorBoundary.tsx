import React from 'react';

interface AppErrorBoundaryProps {
  children?: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Dneprfilm runtime error:', error, info);
  }

  private retry = () => {
    try {
      sessionStorage.removeItem('dneprfilm_asset_reload');
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3">Dneprfilm</p>
          <h1 className="text-2xl font-bold mb-4">Сторінку не вдалося завантажити</h1>
          <p className="text-slate-300 leading-relaxed mb-6">
            Виникла помилка під час запуску сайту. Оновіть сторінку — це зазвичай трапляється після публікації нової версії, коли браузер ще тримає старі файли в кеші.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Оновити сайт
          </button>
          <details className="mt-6 text-xs text-slate-500">
            <summary className="cursor-pointer">Технічні деталі</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
          </details>
        </div>
      </main>
    );
  }
}
