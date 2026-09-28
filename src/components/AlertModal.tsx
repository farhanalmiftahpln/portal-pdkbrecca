import React from 'react';
import { useAlertStore } from '../store/useAlertStore';

export default function AlertModal() {
  const { isOpen, message, title, closeAlert } = useAlertStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-[#0d161a] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col gap-4"
      >
        <h3 className="text-lg font-bold text-white text-center tracking-wide">
          {title}
        </h3>
        <p className="text-sm text-gray-300 text-center leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={closeAlert}
            className="px-6 py-2 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
