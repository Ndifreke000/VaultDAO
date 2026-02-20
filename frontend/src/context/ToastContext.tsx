import React, { useCallback, useRef, useState } from 'react';
import * as Notifications from '../utils/notifications';
// The 'type' keyword here is the fix for the TS1484 error
import { ToastContext, type ToastLevel } from '../hooks/useToast';

export interface ToastItem { 
  id: string; 
  message: string; 
  level: ToastLevel; 
}

const TOAST_LEVEL_STYLES: Record<ToastLevel, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

let toastIdCounter = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = dismissTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, level: ToastLevel = 'info') => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((prev) => [...prev, { id, message, level }]);
    setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const notify = useCallback((_eventType: Notifications.NotificationEventKey, message: string, level: ToastLevel = 'info') => {
    const prefs = Notifications.loadNotificationPreferences();
    if (prefs.frequency === 'off') return;
    showToast(message, level);
  }, [showToast]);

  const sendTestNotification = useCallback(() => showToast('Test notification', 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ notify, sendTestNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-6 py-4 rounded-lg shadow-lg border ${TOAST_LEVEL_STYLES[t.level]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};