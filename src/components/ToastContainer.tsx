import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] no-print"
    >
      {toasts.map((toast) => {
        const styleMap = {
          success: {
            wrap: 'bg-white border-emerald-200 text-slate-900',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          },
          info: {
            wrap: 'bg-white border-blue-200 text-slate-900',
            icon: <Info className="w-5 h-5 text-blue-700 shrink-0" />,
          },
          warning: {
            wrap: 'bg-white border-amber-200 text-slate-900',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          },
          error: {
            wrap: 'bg-white border-red-200 text-slate-900',
            icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-200 ${styleMap.wrap}`}
          >
            <div className="mt-0.5">{styleMap.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
