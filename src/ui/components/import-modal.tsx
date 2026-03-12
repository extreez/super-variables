import React, { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [importMethod, setImportMethod] = useState<"text" | "file">("text");
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [format, setFormat] = useState<"css" | "json" | "scss">("json");
  const [importContent, setImportContent] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportContent(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleParse = (content: string) => {
    setError("");
    try {
      if (format === "json") {
        const parsed = JSON.parse(content);
        setPreview(parsed);
      } else if (format === "css" || format === "scss") {
        // Simple CSS parser for demo
        const lines = content.split("\n");
        const tokens: Record<string, string> = {};
        lines.forEach((line) => {
          const match = line.match(/--([^:]+):\s*([^;]+);/);
          if (match) {
            tokens[match[1].trim()] = match[2].trim();
          }
        });
        setPreview({ tokens });
      }
    } catch (err) {
      setError("Invalid format. Please check your input.");
    }
  };

  const handleImport = () => {
    if (!preview) {
      setError("Please provide valid content to import.");
      return;
    }

    onImport({
      mode: importMode,
      data: preview,
    });
    
    // Reset and close
    setImportContent("");
    setPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-medium text-[#333]">Import Variables</h2>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#333] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Import Method */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Import Method
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportMethod("text")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    importMethod === "text"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  <FileText size={12} />
                  Text Field
                </button>
                <button
                  onClick={() => {
                    setImportMethod("file");
                    fileInputRef.current?.click();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    importMethod === "file"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  <Upload size={12} />
                  Upload File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.css,.scss"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Format
              </label>
              <div className="flex gap-2">
                {(["json", "css", "scss"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                      format === fmt
                        ? "bg-[#0d99ff] text-white"
                        : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Import Mode */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Import Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportMode("create")}
                  className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    importMode === "create"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  Create New Tokens
                </button>
                <button
                  onClick={() => setImportMode("update")}
                  className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    importMode === "update"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  Update Existing
                </button>
              </div>
            </div>

            {/* Input Area */}
            {importMethod === "text" && (
              <div>
                <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                  Paste Content
                </label>
                <textarea
                  value={importContent}
                  onChange={(e) => {
                    setImportContent(e.target.value);
                    handleParse(e.target.value);
                  }}
                  placeholder={`Paste your ${format.toUpperCase()} content here...`}
                  className="w-full h-48 px-3 py-2 text-[11px] font-mono border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] resize-none"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-700">{error}</p>
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div>
                <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                  Preview
                </label>
                <div className="border border-[#e5e5e5] rounded p-3 bg-[#fafafa] max-h-48 overflow-y-auto">
                  <pre className="text-[10px] font-mono text-[#333] whitespace-pre-wrap">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
                <p className="text-[10px] text-[#999] mt-1.5">
                  {Object.keys(preview.tokens || preview).length} token(s) detected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#e5e5e5]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[11px] text-[#666] hover:text-[#333] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer ${
              preview
                ? "bg-[#0d99ff] text-white hover:bg-[#0c8ae6]"
                : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
            }`}
          >
            <Upload size={12} />
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
