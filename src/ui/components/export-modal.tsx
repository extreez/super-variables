import React, { useState, useEffect } from "react";
import { X, Download, Copy, FileText, Globe, Smartphone, Code, Settings2, Package, Save } from "lucide-react";
import JSZip from "jszip";

import { 
  CollectionData, 
  TokenData, 
  ExportSettings, 
  ExportPlatform, 
  ExportFormat, 
  ColorFormat, 
  UnitSystem, 
  AliasStrategy, 
  ModeStrategy,
  ExportFile
} from "../../core/types";
import { ExportGenerator } from "../../core/generator";
import { Language, translations } from "../locales";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionData[];
  tokens: TokenData[];
  language?: Language;
}

export function ExportModal({ isOpen, onClose, collections, tokens, language = 'en' }: ExportModalProps) {
  const t = translations[language];
  const [platform, setPlatform] = useState<ExportPlatform>("web");
  const [format, setFormat] = useState<ExportFormat>("css");
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("px");
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [aliasStrategy, setAliasStrategy] = useState<AliasStrategy>("reference");
  const [modeStrategy, setModeStrategy] = useState<ModeStrategy>("root-comments");
  const [groupDivider, setGroupDivider] = useState("--");
  const [includeIds, setIncludeIds] = useState(false);
  const [includeCustomIds, setIncludeCustomIds] = useState(false);
  const [includeScopes, setIncludeScopes] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [selectedModeIds, setSelectedModeIds] = useState<Record<string, string[]>>({});
  const [selectorTemplate, setSelectorTemplate] = useState(".{modeName}");
  
  const [exportMethod, setExportMethod] = useState<"text" | "file" | "zip">("text");
  const [exportedFiles, setExportedFiles] = useState<ExportFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  useEffect(() => {
    // Update selected collections and modes when collections prop changes
    if (collections.length > 0) {
      // Initialize selection if it's empty
      if (selectedCollectionIds.size === 0) {
        setSelectedCollectionIds(new Set(collections.map(c => c.id)));
      }

      // Default mode selection: all modes for each collection
      const defaultModes: Record<string, string[]> = {};
      collections.forEach(col => {
        defaultModes[col.id] = col.modes.map(m => m.modeId);
      });
      setSelectedModeIds(defaultModes);
    }
  }, [collections]);

  // Adjust format based on platform
  useEffect(() => {
    if (platform === 'web') {
      if (!['css', 'scss', 'less', 'sass', 'tailwind'].includes(format)) setFormat('css');
    } else if (platform === 'ios') {
      setFormat('swift');
    } else if (platform === 'android') {
      setFormat('xml');
    } else if (platform === 'flutter') {
      setFormat('dart');
    } else if (['style-dictionary', 'dtcg', 'json'].includes(platform)) {
      setFormat('json');
    }
  }, [platform]);

  if (!isOpen) return null;

  const handleExport = async () => {
    const settings: ExportSettings = {
      platform,
      format,
      colorFormat,
      unitSystem,
      baseFontSize,
      aliasStrategy,
      modeStrategy,
      groupDivider,
      includeIds,
      includeCustomIds,
      includeScopes,
      selectedCollectionIds: Array.from(selectedCollectionIds),
      selectedModeIds,
      selectorTemplate
    };

    const result = ExportGenerator.generate(tokens, collections, settings);
    setExportedFiles(result.files);
    setCurrentFileIndex(0);

    if (exportMethod === "file" && result.files.length > 0) {
      downloadFile(result.files[0]);
    } else if (exportMethod === "zip" && result.files.length > 0) {
      await downloadZip(result.files);
    }
  };

  const downloadFile = (file: ExportFile) => {
    const blob = new Blob([file.content], { type: file.type === 'json' ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async (files: ExportFile[]) => {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "variables_export.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (exportedFiles[currentFileIndex]) {
      navigator.clipboard.writeText(exportedFiles[currentFileIndex].content);
      // Optional: show toast
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0d99ff] flex items-center justify-center text-white">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">{t.export.title}</h2>
              <p className="text-[10px] text-[#666]">Configure and export your design tokens for any platform</p>
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Settings */}
          <div className="w-1/3 border-r border-[#e5e5e5] flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Platforms */}
              <section>
                <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe size={12} /> {t.export.platform}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'web', label: 'Web', icon: Globe },
                    { id: 'ios', label: 'iOS', icon: Smartphone },
                    { id: 'android', label: 'Android', icon: Smartphone },
                    { id: 'flutter', label: 'Flutter', icon: Smartphone },
                    { id: 'style-dictionary', label: 'Style Dict', icon: Code },
                    { id: 'dtcg', label: 'DTCG', icon: Code },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id as ExportPlatform)}
                      className={`flex items-center gap-2 px-3 py-2 text-[11px] rounded-lg border transition-all cursor-pointer ${
                        platform === p.id
                          ? "bg-[#eef7ff] border-[#0d99ff] text-[#0d99ff] font-medium"
                          : "border-[#e5e5e5] text-[#666] hover:border-[#ccc] hover:bg-[#f9f9f9]"
                      }`}
                    >
                      <p.icon size={12} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Format Specifics */}
              <section className="space-y-4 pt-4 border-t border-[#f0f0f0]">
                <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Settings2 size={12} /> {t.settings.title}
                </h3>
                
                {/* Format (Web only) */}
                {platform === 'web' && (
                  <div>
                    <label className="text-[11px] text-[#666] mb-1.5 block">{t.export.format}</label>
                    <div className="flex flex-wrap gap-2">
                      {['css', 'scss', 'less', 'tailwind'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setFormat(f as ExportFormat)}
                          className={`px-3 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                            format === f ? "bg-[#333] text-white" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e5e5e5]"
                          }`}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Model */}
                <div>
                  <label className="text-[11px] text-[#666] mb-1.5 block">{t.export.colorModel}</label>
                  <div className="flex gap-2">
                    {['hex', 'rgba', 'hsl'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setColorFormat(c as ColorFormat)}
                        className={`flex-1 px-3 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                          colorFormat === c ? "bg-[#333] text-white" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e5e5e5]"
                        }`}
                      >
                        {c.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] text-[#666] mb-1.5 block">{t.export.units}</label>
                    <select 
                      value={unitSystem}
                      onChange={(e) => setUnitSystem(e.target.value as UnitSystem)}
                      className="w-full px-2 py-1.5 text-[11px] border border-[#e5e5e5] rounded-md focus:ring-1 focus:ring-[#0d99ff] outline-none"
                    >
                      <option value="px">Pixels (px)</option>
                      <option value="rem">REM (relative)</option>
                    </select>
                  </div>
                  {unitSystem === 'rem' && (
                    <div className="w-24">
                      <label className="text-[11px] text-[#666] mb-1.5 block">Base Size</label>
                      <input 
                        type="number"
                        value={baseFontSize}
                        onChange={(e) => setBaseFontSize(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-[11px] border border-[#e5e5e5] rounded-md outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Mode Strategy (Web/CSS only) */}
                {format === 'css' && (
                  <div>
                    <label className="text-[11px] text-[#666] mb-1.5 block">{t.table.mode} Handling</label>
                    <select 
                      value={modeStrategy}
                      onChange={(e) => setModeStrategy(e.target.value as ModeStrategy)}
                      className="w-full px-2 py-1.5 text-[11px] border border-[#e5e5e5] rounded-md outline-none"
                    >
                      <option value="root-comments">Single file (:root + comments)</option>
                      <option value="selectors">Single file (Custom selectors)</option>
                      <option value="separate-files">Separate files (Multiple CSS)</option>
                    </select>
                    {modeStrategy === 'selectors' && (
                      <div className="mt-2">
                        <label className="text-[10px] text-[#999] mb-1 block">Selector Template</label>
                        <input 
                          type="text"
                          value={selectorTemplate}
                          onChange={(e) => setSelectorTemplate(e.target.value)}
                          className="w-full px-2 py-1.5 text-[11px] font-mono border border-[#e5e5e5] rounded-md"
                          placeholder=".{modeName}"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div>
                  <label className="text-[11px] text-[#666] mb-1.5 block">Group Divider</label>
                  <input 
                    type="text"
                    value={groupDivider}
                    onChange={(e) => setGroupDivider(e.target.value)}
                    className="w-full px-2 py-1.5 text-[11px] border border-[#e5e5e5] rounded-md outline-none"
                  />
                </div>

                {/* Alias */}
                <div>
                  <label className="text-[11px] text-[#666] mb-1.5 block">Alias Resolution</label>
                  <select 
                    value={aliasStrategy}
                    onChange={(e) => setAliasStrategy(e.target.value as AliasStrategy)}
                    className="w-full px-2 py-1.5 text-[11px] border border-[#e5e5e5] rounded-md outline-none"
                  >
                    <option value="reference">Keep References (var/alias)</option>
                    <option value="resolve">Flatten Values (Final color/size)</option>
                  </select>
                </div>
              </section>

              {/* Collections Picker */}
              <section className="pt-4 border-t border-[#f0f0f0]">
                <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-widest mb-3">{t.sidebar.collections}</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                  {collections.map((col) => (
                    <div key={col.id} className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCollectionIds.has(col.id)}
                          onChange={() => {
                            const newSet = new Set(selectedCollectionIds);
                            if (newSet.has(col.id)) newSet.delete(col.id);
                            else newSet.add(col.id);
                            setSelectedCollectionIds(newSet);
                          }}
                          className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff]"
                        />
                        <span className="text-[11px] text-[#333] group-hover:text-[#0d99ff] transition-colors">{col.name}</span>
                      </label>
                      {selectedCollectionIds.has(col.id) && col.modes.length > 1 && (
                        <div className="ml-5 flex flex-wrap gap-1.5">
                          {col.modes.map(mode => (
                            <button
                              key={mode.modeId}
                              onClick={() => {
                                const currentModes = selectedModeIds[col.id] || [];
                                const newModes = currentModes.includes(mode.modeId)
                                  ? currentModes.filter(id => id !== mode.modeId)
                                  : [...currentModes, mode.modeId];
                                setSelectedModeIds({...selectedModeIds, [col.id]: newModes});
                              }}
                              className={`px-1.5 py-0.5 text-[9px] rounded-sm transition-all cursor-pointer ${
                                (selectedModeIds[col.id] || []).includes(mode.modeId)
                                  ? "bg-[#eef7ff] text-[#0d99ff] border border-[#0d99ff]"
                                  : "bg-[#f5f5f5] text-[#999] border border-transparent"
                              }`}
                            >
                              {mode.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Options */}
              <section className="pt-4 border-t border-[#f0f0f0] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeScopes}
                    onChange={(e) => setIncludeScopes(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff]"
                  />
                  <span className="text-[11px] text-[#333]">Include {t.import.scopes} Config (JSON)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIds}
                    onChange={(e) => setIncludeIds(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff]"
                  />
                  <span className="text-[11px] text-[#333]">Include Figma IDs in metadata</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCustomIds}
                    onChange={(e) => setIncludeCustomIds(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff]"
                  />
                  <span className="text-[11px] text-[#333]">Include Custom IDs for snapping</span>
                </label>
              </section>
            </div>

            {/* Actions Footer (Left) */}
            <div className="p-6 border-t border-[#e5e5e5] bg-[#fafafa]">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[11px] text-[#666] font-medium hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-[11px] bg-[#0d99ff] text-white font-semibold rounded-lg hover:bg-[#0c8ae6] shadow-sm transition-all cursor-pointer"
                >
                  <Save size={14} /> {t.export.generate}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Preview */}
          <div className="flex-1 flex flex-col bg-white text-[#333]">
            {/* Preview Toolbar */}
            <div className="h-12 flex items-center justify-between px-6 bg-[#f5f5f5] border-b border-[#e5e5e5]">
              <div className="flex items-center gap-4 overflow-x-auto max-w-[60%] scrollbar-hide">
                {exportedFiles.length > 0 ? (
                  exportedFiles.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentFileIndex(i)}
                      className={`text-[11px] px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                        currentFileIndex === i ? "bg-white text-[#0d99ff] shadow-sm border border-[#e5e5e5]" : "text-[#666] hover:text-[#333]"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))
                ) : (
                  <span className="text-[11px] text-[#999]">{language === 'ru' ? 'Превью недоступно' : 'No preview available'}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-[#e5e5e5] rounded p-0.5">
                  {[
                    { id: 'text', icon: FileText, label: language === 'ru' ? 'Превью' : 'Preview' },
                    { id: 'file', icon: Download, label: language === 'ru' ? 'Один файл' : 'Single File' },
                    { id: 'zip', icon: Package, label: language === 'ru' ? 'ZIP пакет' : 'ZIP Package' },
                    { id: 'git', icon: Save, label: language === 'ru' ? 'Пуш в Git (Скоро)' : 'Push to Git (Coming Soon)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      disabled={m.id === 'git'}
                      onClick={() => setExportMethod(m.id as any)}
                      title={m.label}
                      className={`p-1.5 rounded transition-all cursor-pointer ${
                        exportMethod === m.id ? "bg-white text-[#0d99ff] shadow-sm" : "text-[#666] hover:text-[#333]"
                      } ${m.id === 'git' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <m.icon size={14} />
                    </button>
                  ))}
                </div>
                {exportedFiles.length > 0 && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-white text-[#333] border border-[#e5e5e5] rounded hover:bg-[#fafafa] transition-colors cursor-pointer shadow-sm"
                  >
                    <Copy size={12} /> {t.export.copy}
                  </button>
                )}
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 overflow-auto p-6 font-mono text-[12px] leading-relaxed relative bg-[#fcfcfc]">
              {exportedFiles.length > 0 ? (
                <pre className="selection:bg-[#eef7ff] text-[#333] whitespace-pre-wrap break-all max-w-full">
                  {exportedFiles[currentFileIndex]?.content}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#ccc]">
                  <Code size={48} className="mb-4" />
                  <p className="text-[13px]">{language === 'ru' ? `Нажмите "${t.export.generate}" для просмотра` : `Click "${t.export.generate}" to see the output`}</p>
                </div>
              )}
            </div>

            {/* Final Export Button */}
            {exportedFiles.length > 0 && exportMethod !== 'text' && (
              <div className="p-4 bg-white border-t border-[#e5e5e5] flex justify-end">
                <button
                  onClick={async () => {
                    if (exportMethod === 'file') downloadFile(exportedFiles[currentFileIndex]);
                    else if (exportMethod === 'zip') await downloadZip(exportedFiles);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-[#0d99ff] text-white text-[11px] font-bold rounded hover:bg-[#0c8ae6] transition-all cursor-pointer shadow-md"
                >
                  <Download size={14} /> 
                  {exportMethod === 'file' 
                    ? `${t.export.download} ${exportedFiles[currentFileIndex].name}` 
                    : (language === 'ru' ? 'Скачать всё как ZIP' : 'Download all as ZIP')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}