import React, { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle, Settings2, Database, Download } from "lucide-react";
import { ImportParser } from "../../core/parser";
import { ImportSettings, ImportPayload, CollectionData } from "../../core/types";
import { Language, translations } from "../locales";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: ImportPayload) => void;
  collections?: CollectionData[]; // Pass collections if available to populate dropdowns
  language?: Language;
}

export function ImportModal({ isOpen, onClose, onImport, collections = [], language = 'en' }: ImportModalProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<"tokens" | "scopes" | "changes">("tokens");
  
  // Tokens state
  const [importMethod, setImportMethod] = useState<"text" | "file">("text");
  const [format, setFormat] = useState<"css" | "json" | "scss">("css");
  const [importContent, setImportContent] = useState("");
  
  // Scopes state
  const [scopesContent, setScopesContent] = useState("");
  
  // Changes state
  const [changesContent, setChangesContent] = useState("");

  // Settings state
  const [strategy, setStrategy] = useState<"auto" | "manual">("auto");
  const [importMode, setImportMode] = useState<"create" | "update">("update");
  const [useCustomIds, setUseCustomIds] = useState(false);
  const [groupDivider, setGroupDivider] = useState("--");
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [targetCollectionId, setTargetCollectionId] = useState("");
  const [targetModeId, setTargetModeId] = useState("");

  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportPayload | null>(null);
  
  const tokensFileRef = useRef<HTMLInputElement>(null);
  const scopesFileRef = useRef<HTMLInputElement>(null);
  const changesFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "tokens" | "scopes" | "changes") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (type === "tokens") {
        setImportContent(content);
        if (file.name.endsWith('.json')) setFormat('json');
        else if (file.name.endsWith('.scss')) setFormat('scss');
        else setFormat('css');
      } else if (type === "scopes") {
        setScopesContent(content);
      } else if (type === "changes") {
        setChangesContent(content);
      }
      handleParse(type === "tokens" ? content : importContent, type);
    };
    reader.readAsText(file);
  };

  const handleParse = (tokensText: string = importContent, triggeringType?: string) => {
    setError("");
    try {
      const settings: ImportSettings = {
        strategy,
        importMode,
        useCustomIds,
        format,
        groupDivider,
        baseFontSize,
        targetCollectionId: strategy === 'manual' ? (targetCollectionId || 'Imported') : undefined,
        targetModeId: strategy === 'manual' ? (targetModeId || 'default') : undefined,
      };

      let parsedPayload: ImportPayload = { tokens: [], settings };

      // Parse Tokens
      if (tokensText.trim()) {
        parsedPayload = ImportParser.parse(tokensText, format, settings);
      }

      // Parse Scopes
      if (scopesContent.trim()) {
        try {
          parsedPayload.scopes = JSON.parse(scopesContent);
        } catch (e) {
          if (triggeringType === 'scopes') throw new Error("Invalid Scopes JSON format");
        }
      }

      // Parse Changes
      if (changesContent.trim()) {
        try {
          const manualChanges = JSON.parse(changesContent);
          if (!parsedPayload.changes) {
            parsedPayload.changes = manualChanges;
          } else {
            // Merge renames
            if (manualChanges.renames) {
              parsedPayload.changes.renames = { ...parsedPayload.changes.renames, ...manualChanges.renames };
            }
            // Merge deletions
            if (manualChanges.deletions) {
              const existingDeletions = parsedPayload.changes.deletions || [];
              parsedPayload.changes.deletions = Array.from(new Set([...existingDeletions, ...manualChanges.deletions]));
            }
          }
        } catch (e) {
          if (triggeringType === 'changes') throw new Error("Invalid Changes JSON format");
        }
      }

      setPreview(parsedPayload);
    } catch (err: any) {
      setError(err.message || "Failed to parse input. Please check the format.");
      setPreview(null);
    }
  };

  const handleImport = () => {
    if (!preview) {
      setError("Please provide valid content to import.");
      return;
    }
    
    // Check if anything is actually being imported
    if (preview.tokens.length === 0 && !preview.scopes && !preview.changes) {
       setError("Nothing to import. Please provide tokens, scopes, or changes.");
       return;
    }

    onImport(preview);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0d99ff] flex items-center justify-center text-white">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">{t.import.title}</h2>
              <p className="text-[10px] text-[#666]">Import tokens, scopes, or apply bulk changes</p>
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
          {/* Left Side: Inputs & Settings */}
          <div className="w-1/2 border-r border-[#e5e5e5] flex flex-col bg-white">
            
            {/* Tabs */}
            <div className="flex border-b border-[#e5e5e5] px-6 pt-4 gap-6 bg-[#fafafa]">
              {(['tokens', 'scopes', 'changes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[12px] font-medium capitalize tracking-wide transition-colors cursor-pointer border-b-2 ${
                    activeTab === tab ? "border-[#0d99ff] text-[#0d99ff]" : "border-transparent text-[#666] hover:text-[#333]"
                  }`}
                >
                  {tab === 'tokens' ? t.import.tokens : tab === 'scopes' ? t.import.scopes : t.import.changes}
                  {(tab === 'scopes' && scopesContent) || (tab === 'changes' && changesContent) ? ' ✓' : ''}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TOKENS TAB */}
              {activeTab === 'tokens' && (
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">Format</label>
                      <div className="flex gap-2">
                        {(["css", "json", "scss"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => { setFormat(fmt); handleParse(); }}
                            className={`flex-1 py-1.5 text-[11px] rounded transition-all cursor-pointer ${
                              format === fmt ? "bg-[#333] text-white" : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
                            }`}
                          >
                            {fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] text-[#666] uppercase tracking-wider">{t.import.content}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setImportMethod("text")}
                          className={`text-[10px] px-2 py-1 rounded cursor-pointer ${importMethod === 'text' ? 'bg-[#eef7ff] text-[#0d99ff]' : 'text-[#666]'}`}
                        >{t.import.text}</button>
                        <button
                          onClick={() => { setImportMethod("file"); tokensFileRef.current?.click(); }}
                          className={`text-[10px] px-2 py-1 rounded cursor-pointer ${importMethod === 'file' ? 'bg-[#eef7ff] text-[#0d99ff]' : 'text-[#666]'}`}
                        >{t.import.file}</button>
                      </div>
                      <input ref={tokensFileRef} type="file" accept=".css,.scss,.json" onChange={(e) => handleFileSelect(e, 'tokens')} className="hidden" />
                    </div>
                    
                    {importMethod === 'text' && (
                      <textarea
                        value={importContent}
                        onChange={(e) => {
                          setImportContent(e.target.value);
                          handleParse(e.target.value);
                        }}
                        placeholder={t.import.pastePlaceholder.replace('{format}', format.toUpperCase())}
                        className="w-full h-48 px-3 py-2 text-[11px] font-mono border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] resize-none bg-[#fafafa]"
                      />
                    )}
                    {importMethod === 'file' && (
                      <div className="w-full h-48 border-2 border-dashed border-[#e5e5e5] rounded flex flex-col items-center justify-center bg-[#fafafa]">
                         <Upload size={24} className="text-[#ccc] mb-2" />
                         <p className="text-[11px] text-[#666]">File loaded. Switch to text to edit.</p>
                      </div>
                    )}
                  </div>

                  {/* Strategy Settings */}
                  <div className="p-4 border border-[#eef7ff] bg-[#f9fcff] rounded-lg space-y-4">
                    <h3 className="text-[11px] font-bold text-[#0d99ff] uppercase tracking-widest flex items-center gap-2">
                      <Settings2 size={12} /> {t.import.mappingSettings}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-[#666] mb-1 block">{t.import.strategy}</label>
                        <select 
                          value={strategy} 
                          onChange={(e) => { setStrategy(e.target.value as any); handleParse(); }}
                          className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded outline-none"
                        >
                          <option value="auto">{t.import.autoDetect}</option>
                          <option value="manual">{t.import.manualOverride}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#666] mb-1 block">{t.import.behavior}</label>
                        <select 
                          value={importMode} 
                          onChange={(e) => setImportMode(e.target.value as any)}
                          className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded outline-none"
                        >
                          <option value="update">{t.import.updateExisting}</option>
                          <option value="create">{t.import.forceCreate}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input 
                          type="checkbox" 
                          id="useCustomIds" 
                          checked={useCustomIds} 
                          onChange={(e) => { setUseCustomIds(e.target.checked); handleParse(); }}
                          className="w-3.5 h-3.5 border-[#d0e6ff] rounded text-[#0d99ff] focus:ring-[#0d99ff] cursor-pointer"
                        />
                        <label htmlFor="useCustomIds" className="text-[11px] text-[#444] font-medium cursor-pointer select-none flex items-center gap-1.5">
                          Snap by Custom ID
                          <span className="text-[9px] text-[#999] font-normal">(Updates variable even if name changed)</span>
                        </label>
                    </div>

                    {strategy === 'manual' && (
                      <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                         <div>
                            <label className="text-[10px] text-[#666] mb-1 block">{t.import.targetCollection}</label>
                            <div className="space-y-1">
                              <select 
                                value={collections.some(c => c.name === targetCollectionId) ? targetCollectionId : ""}
                                onChange={(e) => { 
                                  const val = e.target.value;
                                  setTargetCollectionId(val); 
                                  // Reset mode if switching collections
                                  setTargetModeId("");
                                  handleParse(); 
                                }}
                                className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded outline-none bg-white"
                              >
                                <option value="">-- Select existing --</option>
                                {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="Or type new name..." 
                                  value={targetCollectionId}
                                  onChange={(e) => { setTargetCollectionId(e.target.value); handleParse(); }}
                                  className="w-full px-2 py-1.5 text-[10px] border border-[#e5e5e5] rounded focus:border-[#0d99ff] outline-none"
                                />
                                {targetCollectionId && !collections.some(c => c.name === targetCollectionId) && (
                                  <div className="absolute right-2 top-1.5 text-[9px] text-amber-600 font-medium">New</div>
                                )}
                              </div>
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] text-[#666] mb-1 block">{t.import.targetMode}</label>
                            <div className="space-y-1">
                              {collections.find(c => c.name === targetCollectionId) ? (
                                <select
                                  value={targetModeId}
                                  onChange={(e) => { setTargetModeId(e.target.value); handleParse(); }}
                                  className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded outline-none bg-white"
                                >
                                  <option value="">-- Select mode --</option>
                                  {collections.find(c => c.name === targetCollectionId)?.modes.map(m => (
                                    <option key={m.modeId} value={m.name}>{m.name}</option>
                                  ))}
                                  <option value="NEW_MODE">+ Create new mode...</option>
                                </select>
                              ) : null}
                              
                              {(targetModeId === "NEW_MODE" || !collections.find(c => c.name === targetCollectionId)) && (
                                <input 
                                  type="text"
                                  value={targetModeId === "NEW_MODE" ? "" : targetModeId}
                                  onChange={(e) => { setTargetModeId(e.target.value); handleParse(); }}
                                  placeholder="Type mode name (e.g. Dark)"
                                  className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded outline-none"
                                  autoFocus={targetModeId === "NEW_MODE"}
                                />
                              )}
                            </div>
                         </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                       <div>
                          <label className="text-[10px] text-[#666] mb-1 block">Group Divider</label>
                          <input 
                            type="text" 
                            value={groupDivider} 
                            onChange={(e) => { setGroupDivider(e.target.value); handleParse(); }}
                            className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] text-[#666] mb-1 block">Base Font Size (px to rem)</label>
                          <input 
                            type="number" 
                            value={baseFontSize} 
                            onChange={(e) => { setBaseFontSize(Number(e.target.value)); handleParse(); }}
                            className="w-full px-2 py-1.5 text-[11px] border border-[#d0e6ff] rounded"
                          />
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCOPES TAB */}
              {activeTab === 'scopes' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-[#666]">
                    {t.import.scopesDescription}
                  </p>
                  <div className="flex gap-2 mb-2">
                      <button onClick={() => scopesFileRef.current?.click()} className="px-3 py-1.5 text-[11px] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded">Upload scopes.json</button>
                      <input ref={scopesFileRef} type="file" accept=".json" onChange={(e) => handleFileSelect(e, 'scopes')} className="hidden" />
                  </div>
                  <textarea
                    value={scopesContent}
                    onChange={(e) => { setScopesContent(e.target.value); handleParse(undefined, 'scopes'); }}
                    placeholder="Paste Scopes JSON here..."
                    className="w-full h-64 px-3 py-2 text-[11px] font-mono border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] resize-none bg-[#fafafa]"
                  />
                </div>
              )}

              {/* CHANGES TAB */}
              {activeTab === 'changes' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-[#666]">
                    {t.import.changesDescription}
                  </p>
                  <pre className="text-[9px] bg-[#f5f5f5] p-2 rounded text-[#666]">
                    {`{\n  "renames": { "old/path": "new/path" },\n  "deletions": ["path/to/remove"]\n}`}
                  </pre>
                  <div className="flex gap-2 mb-2">
                      <button onClick={() => changesFileRef.current?.click()} className="px-3 py-1.5 text-[11px] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded">Upload changes.json</button>
                      <input ref={changesFileRef} type="file" accept=".json" onChange={(e) => handleFileSelect(e, 'changes')} className="hidden" />
                  </div>
                  <textarea
                    value={changesContent}
                    onChange={(e) => { setChangesContent(e.target.value); handleParse(undefined, 'changes'); }}
                    placeholder="Paste Changes JSON here..."
                    className="w-full h-48 px-3 py-2 text-[11px] font-mono border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] resize-none bg-[#fafafa]"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Right Side: Preview */}
          <div className="w-1/2 flex flex-col bg-[#fafafa] border-l border-[#e5e5e5]">
             <div className="h-12 flex items-center px-6 bg-white border-b border-[#e5e5e5]">
                <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-widest flex items-center gap-2">
                  <Database size={12} /> {t.import.executionPlan}
                </h3>
             </div>
             
             <div className="flex-1 p-6 overflow-y-auto">
                {error ? (
                  <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
                  </div>
                ) : preview ? (
                  <div className="space-y-6">
                     
                     {/* Tokens Preview */}
                     {preview.tokens.length > 0 && (
                       <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-[#f5f5f5] px-4 py-2 border-b border-[#e5e5e5] flex justify-between items-center">
                             <span className="text-[11px] font-semibold text-[#333]">Parsed Tokens ({preview.tokens.length})</span>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2">
                            <table className="w-full text-left text-[10px]">
                              <thead>
                                <tr className="text-[#999]">
                                  <th className="font-normal px-2 py-1">{t.import.name}</th>
                                  <th className="font-normal px-2 py-1">{t.import.collection}</th>
                                  <th className="font-normal px-2 py-1">{t.import.mode}</th>
                                  <th className="font-normal px-2 py-1">{t.import.value}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {preview.tokens.slice(0, 100).map((t, i) => (
                                  <tr key={i} className="border-t border-[#f0f0f0] hover:bg-[#fcfcfc]">
                                    <td className="px-2 py-1.5 font-mono text-[#333] truncate max-w-[120px]" title={t.name}>{t.name}</td>
                                    <td className="px-2 py-1.5 text-[#666]">{t.collection}</td>
                                    <td className="px-2 py-1.5 text-[#666]">{t.mode}</td>
                                    <td className="px-2 py-1.5 font-mono text-[#0d99ff] truncate max-w-[100px]" title={t.value}>{t.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {preview.tokens.length > 100 && (
                              <div className="text-center p-2 text-[10px] text-[#999] border-t border-[#f0f0f0]">
                                + {preview.tokens.length - 100} more tokens
                              </div>
                            )}
                          </div>
                       </div>
                     )}

                     {/* Scopes Preview */}
                     {preview.scopes && (
                       <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 shadow-sm">
                          <span className="text-[11px] font-semibold text-[#333] block mb-2">Scopes Data Loaded</span>
                          <p className="text-[10px] text-[#666]">Configured scopes for {Object.keys(preview.scopes).length} variables.</p>
                       </div>
                     )}

                     {/* Changes Preview */}
                     {preview.changes && (
                       <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 shadow-sm">
                          <span className="text-[11px] font-semibold text-[#333] block mb-2">Pre-import Actions</span>
                          <ul className="text-[10px] text-[#666] list-disc list-inside">
                            {preview.changes.renames && <li>Rename {Object.keys(preview.changes.renames).length} variables</li>}
                            {preview.changes.deletions && <li>Delete {preview.changes.deletions.length} variables</li>}
                          </ul>
                       </div>
                     )}

                     {preview.tokens.length === 0 && !preview.scopes && !preview.changes && (
                        <div className="text-center text-[#999] text-[12px] pt-10">
                          Provide data on the left to see the execution plan.
                        </div>
                     )}

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#ccc]">
                    <Database size={48} className="mb-4" />
                    <p className="text-[13px]">Provide input to generate plan</p>
                  </div>
                )}
             </div>

             {/* Action Footer */}
             <div className="p-4 bg-white border-t border-[#e5e5e5] flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[11px] text-[#666] font-medium hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
                >
                  {t.import.cancel}
                </button>
                <button
                  onClick={handleImport}
                  disabled={!preview || !!error || (preview.tokens.length === 0 && !preview.scopes && !preview.changes)}
                  className={`flex items-center gap-2 px-6 py-2 text-[11px] font-bold rounded-lg transition-all shadow-md ${
                    preview && !error && (preview.tokens.length > 0 || preview.scopes || preview.changes)
                      ? "bg-[#0d99ff] text-white hover:bg-[#0c8ae6] cursor-pointer"
                      : "bg-[#e5e5e5] text-[#999] cursor-not-allowed shadow-none"
                  }`}
                >
                  <Download size={14} className="rotate-180" /> {t.import.execute}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
