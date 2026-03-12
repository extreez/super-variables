import React, { useState } from "react";
import { X, Download, Copy, FileText, Upload } from "lucide-react";

import { CollectionData, TokenData, TokenValue } from "../../core/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionData[];
  tokens: TokenData[];
}

export function ExportModal({ isOpen, onClose, collections, tokens }: ExportModalProps) {
  const [format, setFormat] = useState<"css" | "json" | "scss" | "less">("css");
  const [colorModel, setColorModel] = useState<"rgba" | "hex" | "hsl">("rgba");
  const [units, setUnits] = useState<"px" | "rem">("px");
  const [includeScopes, setIncludeScopes] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set(collections.map((c) => c.id))
  );
  const [exportMode, setExportMode] = useState<"root" | "modes">("root");
  const [includeIds, setIncludeIds] = useState(false);
  const [groupDivider, setGroupDivider] = useState("--");
  const [exportMethod, setExportMethod] = useState<"text" | "file">("text");

  const [exportedContent, setExportedContent] = useState("");

  if (!isOpen) return null;

  const formatValue = (v: TokenValue) => {
    if (v.type === 'alias') return `{${v.name}}`;
    if (v.type === 'color') {
      const r = Math.round(v.r * 255);
      const g = Math.round(v.g * 255);
      const b = Math.round(v.b * 255);
      if (colorModel === 'hex') {
        const toHex = (c: number) => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
      if (colorModel === 'hsl') {
        // Simple conversion or keep as rgb
        return `rgb(${r}, ${g}, ${b})`; 
      }
      return `rgba(${r}, ${g}, ${b}, ${v.a})`;
    }
    return v.type === 'float' ? `${v.value}${units === 'rem' ? 'rem' : 'px'}` : String(v.value);
  };

  const handleExport = () => {
    const activeTokens = tokens.filter(t => selectedCollections.has(t.collectionId));
    let content = "";
    
    if (format === "css" || format === "scss" || format === "less") {
      const prefix = format === "css" ? "--" : format === "scss" ? "$" : "@";
      content = format === "css" ? ":root {\n" : "";
      
      activeTokens.forEach(t => {
        const varName = t.name.replace(/\//g, groupDivider);
        // Using first mode for "root" export
        const firstModeId = collections.find(c => c.id === t.collectionId)?.modes[0]?.modeId || '';
        const val = t.valuesByMode[firstModeId];
        if (val) {
          content += `  ${prefix}${varName}: ${formatValue(val)};\n`;
        }
      });
      
      if (format === "css") content += "}\n";
    } else if (format === "json") {
      const result: any = {};
      activeTokens.forEach(t => {
        const parts = t.name.split('/');
        let current = result;
        parts.forEach((p, i) => {
          if (i === parts.length - 1) {
            const firstModeId = collections.find(c => c.id === t.collectionId)?.modes[0]?.modeId || '';
            current[p] = formatValue(t.valuesByMode[firstModeId]);
          } else {
            current[p] = current[p] || {};
            current = current[p];
          }
        });
      });
      content = JSON.stringify(result, null, 2);
    }
    
    setExportedContent(content);

    if (exportMethod === "file") {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tokens.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedContent);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-medium text-[#333]">Export Variables</h2>
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
            {/* Format Selection */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Export Format
              </label>
              <div className="flex gap-2">
                {(["css", "json", "scss", "less"] as const).map((fmt) => (
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

            {/* Color Model */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Color Model
              </label>
              <div className="flex gap-2">
                {(["rgba", "hex", "hsl"] as const).map((model) => (
                  <button
                    key={model}
                    onClick={() => setColorModel(model)}
                    className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                      colorModel === model
                        ? "bg-[#0d99ff] text-white"
                        : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                    }`}
                  >
                    {model.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Units */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Units
              </label>
              <div className="flex gap-2">
                {(["px", "rem"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setUnits(unit)}
                    className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                      units === unit
                        ? "bg-[#0d99ff] text-white"
                        : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Mode */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Export Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportMode("root")}
                  className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    exportMode === "root"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  Root Only
                </button>
                <button
                  onClick={() => setExportMode("modes")}
                  className={`px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    exportMode === "modes"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  With Modes
                </button>
              </div>
            </div>

            {/* Group Divider */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Group Divider
              </label>
              <input
                type="text"
                value={groupDivider}
                onChange={(e) => setGroupDivider(e.target.value)}
                className="w-full px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff]"
                placeholder="--"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeScopes}
                  onChange={(e) => setIncludeScopes(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff] cursor-pointer"
                />
                <span className="text-[11px] text-[#333]">Include Scopes Config</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIds}
                  onChange={(e) => setIncludeIds(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff] cursor-pointer"
                />
                <span className="text-[11px] text-[#333]">Include Token IDs</span>
              </label>
            </div>

            {/* Collections */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Collections to Export
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-[#e5e5e5] rounded p-2">
                {collections.map((collection) => (
                  <label key={collection.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCollections.has(collection.id)}
                      onChange={() => {
                        const newSet = new Set(selectedCollections);
                        if (newSet.has(collection.id)) newSet.delete(collection.id);
                        else newSet.add(collection.id);
                        setSelectedCollections(newSet);
                      }}
                      className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff] cursor-pointer"
                    />
                    <span className="text-[11px] text-[#333]">{collection.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Method */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Export Method
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportMethod("text")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    exportMethod === "text"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  <FileText size={12} />
                  Text Field
                </button>
                <button
                  onClick={() => setExportMethod("file")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer transition-colors ${
                    exportMethod === "file"
                      ? "bg-[#0d99ff] text-white"
                      : "bg-[#f5f5f5] text-[#333] hover:bg-[#e5e5e5]"
                  }`}
                >
                  <Download size={12} />
                  Download File
                </button>
              </div>
            </div>

            {/* Preview/Output */}
            {exportedContent && exportMethod === "text" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-[#666] uppercase tracking-wider">
                    Exported Content
                  </label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#0d99ff] hover:bg-[#f5f5f5] rounded cursor-pointer"
                  >
                    <Copy size={10} />
                    Copy
                  </button>
                </div>
                <textarea
                  value={exportedContent}
                  readOnly
                  className="w-full h-48 px-3 py-2 text-[11px] font-mono border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] resize-none bg-[#fafafa]"
                />
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
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-[#0d99ff] text-white rounded hover:bg-[#0c8ae6] cursor-pointer"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}