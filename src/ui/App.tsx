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
import { useEffect, useCallback, useRef } from "react";

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
  const [navigationReturn, setNavigationReturn] = useState<{ id: string, name: string } | null>(null);
  
  // Real data state
  const [realCollections, setRealCollections] = useState<CollectionData[]>([]);
  const [realTokens, setRealTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Window Resize state
  const [windowSize, setWindowSize] = useState({ width: 900, height: 620 });
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.max(300, e.clientX);
      const newHeight = Math.max(300, e.clientY);
      setWindowSize({ width: newWidth, height: newHeight });
      parent.postMessage({ pluginMessage: { type: 'resize-window', width: newWidth, height: newHeight } }, '*');
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'nwse-resize';
  }, []);

  const refreshData = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
  }, []);

  useEffect(() => {
    // Initial request for data
    refreshData();
    
    // Poll every 5 seconds as requested
    const interval = setInterval(refreshData, 5000);

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
          setRealCollections(data.collections);
          setSelectedCollection(prev => prev || data.collections[0].name);
          setSelectedGroup(prev => prev || "All");
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [refreshData]);

  const handleMinimize = () => {
    setIsWindowMinimized(true);
    parent.postMessage({ pluginMessage: { type: 'resize-window', width: 60, height: 60 } }, '*');
  };

  const handleExpand = () => {
    setIsWindowMinimized(false);
    parent.postMessage({ pluginMessage: { type: 'resize-window', width: windowSize.width, height: windowSize.height } }, '*');
  };

  // Map real data to UI format
  const displayCollections = realCollections.length > 0 
    ? realCollections.map(c => ({ name: c.name, count: c.variableCount }))
    : mockCollections;

  const currentCollectionId = realCollections.find(c => c.name === selectedCollection)?.id;
  
  // Derived groups for the current collection
  const availableTokens = realTokens.filter(t => t.collectionId === currentCollectionId);
  
  const derivedGroups = (() => {
    const groupMap = new Map<string, { name: string, fullName: string, count: number, level: number, isFolder: boolean }>();
    
    // Always add "All" first
    groupMap.set('All', { name: 'All', fullName: 'All', count: availableTokens.length, level: 0, isFolder: false });

    availableTokens.forEach(t => {
      const parts = t.name.split('/');
      if (parts.length > 1) {
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (!groupMap.has(currentPath)) {
            groupMap.set(currentPath, {
              name: part,
              fullName: currentPath,
              count: 0,
              level: i,
              isFolder: true
            });
          }
          // Increment count for this folder and all its parent parts? 
          // Actually user usually wants count of variables directly or in subfolders.
          // Let's count tokens that have this exact prefix.
        }
      }
    });

    // Update counts for folders
    groupMap.forEach((group, path) => {
      if (path === 'All') return;
      group.count = availableTokens.filter(t => t.name.startsWith(path + '/')).length;
    });

    // Convert to array, sorting by path ensuring depth-first or alphabetical
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.fullName === 'All') return -1;
      if (b.fullName === 'All') return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  })();

  const displayGroups = realCollections.length > 0 ? derivedGroups : mockGroups;

  // Filter tokens by collection and group
  const filteredTokens = availableTokens.filter(t => {
    if (selectedGroup === 'All') return true;
    return t.name === selectedGroup || t.name.startsWith(selectedGroup + '/');
  });

  // Convert TokenData to the Variable format expected by components
  const displayVariables = realTokens.length > 0 
    ? filteredTokens.map(t => {
        const firstModeId = realCollections.find(c => c.id === t.collectionId)?.modes[0]?.modeId || '';
        const valueObj = t.valuesByMode[firstModeId];
        let valueStr = '';
        let resolvedValue: string | undefined = undefined;
        let colorSwatch: string | undefined = undefined;
        let isAlias = false;

        if (valueObj) {
          if (valueObj.type === 'alias') {
            isAlias = true;
            valueStr = `{${valueObj.name}}`;
            // Try to find the resolved value from the alias target if it exists in our token list
            const targetToken = realTokens.find(rt => rt.id === valueObj.id);
            if (targetToken) {
              const targetValue = targetToken.valuesByMode[firstModeId];
              if (targetValue && targetValue.type === 'color') {
                const r = Math.round(targetValue.r * 255);
                const g = Math.round(targetValue.g * 255);
                const b = Math.round(targetValue.b * 255);
                resolvedValue = `rgb(${r}, ${g}, ${b})`;
                colorSwatch = resolvedValue;
              } else if (targetValue && targetValue.type !== 'alias') {
                resolvedValue = String(targetValue.value);
              }
            }
          } else if (valueObj.type === 'color') {
            const r = Math.round(valueObj.r * 255);
            const g = Math.round(valueObj.g * 255);
            const b = Math.round(valueObj.b * 255);
            valueStr = `rgb(${r}, ${g}, ${b})`;
            resolvedValue = valueStr;
            colorSwatch = valueStr;
          } else {
            valueStr = String(valueObj.value);
            resolvedValue = valueStr;
          }
        }

        return {
          id: t.id,
          name: t.name.split('/').pop() || t.name,
          path: t.name,
          value: valueStr,
          resolvedValue,
          colorSwatch,
          type: t.resolvedType.toLowerCase() as any,
          isAlias,
          aliasTargetId: valueObj?.type === 'alias' ? valueObj.id : undefined,
        };
      })
    : (mockVariables as any[]).map(v => ({ 
        ...v, 
        path: v.path || v.value, // Fallback for safety
        isAlias: v.value.includes('/') || v.value.startsWith('{'),
        resolvedValue: v.value // For mock data, we'll just show the same value as fallback
      } as Variable));

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

  const handleNavigateToTarget = (targetId: string, fromId: string) => {
    // 1. Find the target token in all real tokens
    const targetToken = realTokens.find(t => t.id === targetId);
    
    if (targetToken) {
      // 2. Teleport UI to correct collection/group if needed
      const coll = realCollections.find(c => c.id === targetToken.collectionId);
      if (coll) setSelectedCollection(coll.name);

      // Determine the best group to show this variable in. 
      // If "All" is selected or acceptable, we could stay, but user said "switch if required".
      // Let's switch to the direct parent folder of the token for best visibility.
      const parts = targetToken.name.split('/');
      if (parts.length > 1) {
        setSelectedGroup(targetToken.name.substring(0, targetToken.name.lastIndexOf('/')));
      } else {
        setSelectedGroup('All');
      }
    }

    if (fromId) {
      // Navigating TO a target, save the one we came from
      // We look in realTokens because displayVariables might be filtered
      const fromToken = realTokens.find(t => t.id === fromId);
      if (fromToken) {
        setNavigationReturn({ id: fromId, name: fromToken.name.split('/').pop() || fromToken.name });
      }
    } else {
      // Navigating BACK (Return button clicked), clear state
      setNavigationReturn(null);
    }
    setSelectedVariableId(targetId);
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
      className="h-screen w-screen flex bg-white overflow-hidden relative"
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
          onSelectCollection={(name) => {
            setSelectedCollection(name);
            setSelectedGroup("All");
          }}
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
          onRefreshClick={refreshData}
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
        onNavigateToTarget={handleNavigateToTarget}
        navigationReturn={navigationReturn}
        onClearNavigationReturn={() => setNavigationReturn(null)}
      />

      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-50 flex items-end justify-end p-0.5"
      >
        <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-[#ccc]" />
      </div>

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