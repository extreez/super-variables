import React, { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { VariablesTable } from "./components/variables-table";
import { VariableDetails } from "./components/variable-details";
import { ExportModal } from "./components/export-modal";
import { ImportModal } from "./components/import-modal";
import { GitSyncModal } from "./components/git-sync-modal";
import {
  collections as mockCollections,
  groups as mockGroups,
  semanticVariables as mockVariables,
} from "./components/variables-data";
import { VariablesPayload, CollectionData, TokenData } from "../core/types";
import { useEffect } from "react";

export default function App() {
  const [selectedCollection, setSelectedCollection] = useState("Colors");
  const [selectedGroup, setSelectedGroup] = useState("Semantics");
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>("1");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [collectionEmojis, setCollectionEmojis] = useState<Record<string, string | null>>({});
  const [groupEmojis, setGroupEmojis] = useState<Record<string, string | null>>({});
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGitSyncModal, setShowGitSyncModal] = useState(false);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);

  // Real data state
  const [realCollections, setRealCollections] = useState<CollectionData[]>([]);
  const [realTokens, setRealTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial request for data
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'variables-loaded') {
        const data = msg.payload as VariablesPayload;
        setRealCollections(data.collections);
        setRealTokens(data.tokens);
        setIsLoading(false);
        
        // Pick first collection and group by default if available
        if (data.collections.length > 0) {
          setSelectedCollection(data.collections[0].name);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMinimize = () => {
    setIsWindowMinimized(true);
    parent.postMessage({ pluginMessage: { type: 'resize-window', width: 60, height: 60 } }, '*');
  };

  const handleExpand = () => {
    setIsWindowMinimized(false);
    parent.postMessage({ pluginMessage: { type: 'resize-window', width: 900, height: 620 } }, '*');
  };

  // Map real data to UI format
  const displayCollections = realCollections.length > 0 
    ? realCollections.map(c => ({ name: c.name, count: c.variableCount }))
    : mockCollections;

  const currentCollectionId = realCollections.find(c => c.name === selectedCollection)?.id;
  
  // Derived groups for the current collection
  const availableTokens = realTokens.filter(t => t.collectionId === currentCollectionId);
  
  const derivedGroups = Array.from(new Set(availableTokens.map(t => {
    const parts = t.name.split('/');
    return parts.length > 1 ? parts[0] : 'All';
  }))).map(name => ({
    name,
    count: name === 'All' 
      ? availableTokens.length 
      : availableTokens.filter(t => t.name.startsWith(name + '/')).length
  }));

  const displayGroups = realCollections.length > 0 ? derivedGroups : mockGroups;

  // Filter tokens by collection and group
  const filteredTokens = availableTokens.filter(t => {
    if (selectedGroup === 'All') return true;
    return t.name.startsWith(selectedGroup + '/');
  });

  // Convert TokenData to the Variable format expected by components
  const displayVariables = realTokens.length > 0 
    ? filteredTokens.map(t => {
        const firstModeId = realCollections.find(c => c.id === t.collectionId)?.modes[0]?.modeId || '';
        const valueObj = t.valuesByMode[firstModeId];
        let valueStr = '';
        let colorSwatch: string | undefined = undefined;

        if (valueObj) {
          if (valueObj.type === 'alias') {
            valueStr = `{${valueObj.name}}`;
          } else if (valueObj.type === 'color') {
            const r = Math.round(valueObj.r * 255);
            const g = Math.round(valueObj.g * 255);
            const b = Math.round(valueObj.b * 255);
            valueStr = `rgb(${r}, ${g}, ${b})`; // Simplified, alpha omitted for brevity in table
            colorSwatch = `rgb(${r}, ${g}, ${b})`;
          } else {
            valueStr = String(valueObj.value);
          }
        }

        return {
          id: t.id,
          name: t.name.split('/').pop() || t.name,
          value: valueStr,
          colorSwatch,
          type: t.resolvedType.toLowerCase() as any,
        };
      })
    : mockVariables;

  const selectedVariable = displayVariables.find((v) => v.id === selectedVariableId) || null;

  const handleImport = (payload: { mode: 'create' | 'update', data: any }) => {
    console.log("Importing data:", payload);
    parent.postMessage({ 
      pluginMessage: { 
        type: 'import-variables', 
        payload 
      } 
    }, '*');
  };

  if (isWindowMinimized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white border border-[#e5e5e5]">
        <button onClick={handleExpand} className="p-2 text-[#999] hover:text-[#333] cursor-pointer" title="Expand">
          <Maximize2 size={24} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen flex bg-white overflow-hidden"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left sidebar */}
      <div className="border-r border-[#e5e5e5] bg-white shrink-0 overflow-y-auto">
        <Sidebar
          collections={displayCollections}
          groups={displayGroups}
          selectedCollection={selectedCollection}
          selectedGroup={selectedGroup}
          collapsed={sidebarCollapsed}
          collectionEmojis={collectionEmojis}
          groupEmojis={groupEmojis}
          onSelectCollection={setSelectedCollection}
          onSelectGroup={setSelectedGroup}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSetCollectionEmoji={(name, emoji) =>
            setCollectionEmojis((prev) => ({ ...prev, [name]: emoji }))
          }
          onSetGroupEmoji={(name, emoji) =>
            setGroupEmojis((prev) => ({ ...prev, [name]: emoji }))
          }
          onImportClick={() => setShowImportModal(true)}
          onExportClick={() => setShowExportModal(true)}
        />
      </div>

      {/* Center — Variables table */}
      <VariablesTable
        variables={displayVariables}
        selectedId={selectedVariableId}
        onSelect={(id) => {
          setSelectedVariableId(id);
        }}
        onGitSyncClick={() => setShowGitSyncModal(true)}
        onMinimizeClick={handleMinimize}
      />

      {/* Right — Details panel */}
      <VariableDetails
        variable={selectedVariable}
        groupName={selectedGroup}
        collapsed={detailsCollapsed}
        onToggleCollapse={() => setDetailsCollapsed(!detailsCollapsed)}
      />

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        collections={realCollections}
        tokens={realTokens}
      />
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
      <GitSyncModal
        isOpen={showGitSyncModal}
        onClose={() => setShowGitSyncModal(false)}
      />
    </div>
  );
}