import React from 'react';
import { X, Globe, Settings } from 'lucide-react';
import { Language, translations } from '../locales';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function SettingsModal({ isOpen, onClose, language, onLanguageChange }: SettingsModalProps) {
  const t = translations[language].settings;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#333] flex items-center justify-center text-white">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">{t.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#999] hover:text-[#333] hover:bg-[#f0f0f0] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe size={12} /> {t.language}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'en', label: 'English' },
                { id: 'ru', label: 'Русский' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => onLanguageChange(lang.id as Language)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] rounded-lg border transition-all cursor-pointer ${
                    language === lang.id
                      ? "bg-[#eef7ff] border-[#0d99ff] text-[#0d99ff] font-medium"
                      : "border-[#e5e5e5] text-[#666] hover:border-[#ccc] hover:bg-[#f9f9f9]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e5e5] bg-[#fafafa] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[11px] bg-[#333] text-white font-semibold rounded-lg hover:bg-[#1a1a1a] shadow-sm transition-all cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
