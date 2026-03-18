import React from "react";
import { X, CheckCircle2, AlertCircle, Download, Info } from "lucide-react";
import { ImportLog } from "../../core/types";
import { Language, translations } from "../locales";

interface ImportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ImportLog | null;
  language?: Language;
  onDownload: () => void;
}

export function ImportResultModal({ isOpen, onClose, log, language = 'en', onDownload }: ImportResultModalProps) {
  const t = translations[language];
  if (!isOpen || !log) return null;

  const hasErrors = log.errors.length > 0;
  const totalChanges = log.added.length + log.updated.length + log.deleted.length + Object.keys(log.renames).length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e5e5e5] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasErrors ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              {hasErrors ? <Info size={14} /> : <CheckCircle2 size={14} />}
            </div>
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Import Results</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#999] hover:text-[#333] hover:bg-[#f0f0f0] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-center">
              <div className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-1">Added</div>
              <div className="text-xl font-bold text-blue-700">{log.added.length}</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
              <div className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider mb-1">Updated</div>
              <div className="text-xl font-bold text-indigo-700">{log.updated.length}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider mb-1">Deleted</div>
              <div className="text-xl font-bold text-slate-700">{log.deleted.length}</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
              <div className="text-[10px] text-amber-600 uppercase font-bold tracking-wider mb-1">Errors</div>
              <div className="text-xl font-bold text-amber-700">{log.errors.length}</div>
            </div>
          </div>

          {hasErrors && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div className="text-[11px] text-red-700 leading-tight">
                <strong>Attention:</strong> {log.errors.length} errors occurred during import. Check the log for details.
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#666] text-center px-4">
            The import has been successfully completed. You can download a detailed JSON report of all changes.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#fafafa] border-t border-[#e5e5e5] flex flex-col gap-2">
          <button
            onClick={onDownload}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#0d99ff] hover:bg-[#0c8ae6] text-white text-[12px] font-bold rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} /> Download Change Log
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[11px] text-[#666] font-medium hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
