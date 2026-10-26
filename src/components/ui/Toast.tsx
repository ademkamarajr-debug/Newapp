import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-6 z-50 animate-bounce-in">
      <div className="bg-[#101827] border border-[#7C3AED]/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
        <div className="w-6 h-6 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold">{toast}</span>
      </div>
    </div>
  );
};
