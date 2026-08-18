import React, { useEffect, useState } from 'react';

let toastFn = () => {};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (type, message) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all transform translate-y-0 duration-300 pointer-events-auto max-w-sm ${
            t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-amber-500' : 'bg-brand-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function toast(type, message) {
  toastFn(type, message);
}
