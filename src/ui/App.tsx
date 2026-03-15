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
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["All"]);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>("1");
  const [selectedVariableIds, setSelectedVariableIds] = useState<string[]>([]);
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
  const [customCollectionOrder, setCustomCollectionOrder] = useState<string[]>([]);
  const [customGroupOrder, setCustomGroupOrder] = useState<Record<string, string[]>>({});
  const [isSortedAlpha, setIsSortedAlpha] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'path' | 'details' | 'scope'>('details');

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
      } else if (msg.type === 'collection-created') {
        setSelectedCollection(msg.name);
        setSelectedGroup("All");
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
  const displayCollections = (() => {
    let cols = realCollections.length > 0
      ? realCollections.map(c => ({ id: c.id, name: c.name, count: c.variableCount }))
      : mockCollections;

    if (isSortedAlpha) {
      return [...cols].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (customCollectionOrder.length > 0) {
      return [...cols].sort((a, b) => {
        const indexA = customCollectionOrder.indexOf(a.id || a.name);
        const indexB = customCollectionOrder.indexOf(b.id || b.name);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return cols;
  })();

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
      const valuesByMode: any = {};

      // Populate all modes for this token
      const collection = realCollections.find(c => c.id === t.collectionId);
      if (collection) {
        collection.modes.forEach(mode => {
          const valueObj = t.valuesByMode[mode.modeId];
          let valueStr = '';
          let resolvedValue: string | undefined = undefined;
          let colorSwatch: string | undefined = undefined;
          let isAlias = false;

          if (valueObj) {
            if (valueObj.type === 'alias') {
              isAlias = true;
              valueStr = valueObj.name;

              // Resolve the alias to its final value/color and trace the path
              const aliasChain: string[] = [valueObj.name];
              let currentAliasId = valueObj.id;
              let resolutionDepth = 0;
              const maxDepth = 10;

              while (resolutionDepth < maxDepth) {
                const targetToken = realTokens.find(rt => rt.id === currentAliasId);
                if (!targetToken) break;

                // Try to find the value in the target token for the current mode
                // If targetToken is in a different collection, mode.modeId won't work directly
                let targetValue = targetToken.valuesByMode[mode.modeId];

                if (!targetValue) {
                  const targetCollection = realCollections.find(c => c.id === targetToken.collectionId);
                  if (targetCollection) {
                    const matchingMode = targetCollection.modes.find(m => m.name === mode.name);
                    if (matchingMode) {
                      targetValue = targetToken.valuesByMode[matchingMode.modeId];
                    } else if (targetCollection.modes.length > 0) {
                      targetValue = targetToken.valuesByMode[targetCollection.modes[0].modeId];
                    }
                  }
                }

                if (!targetValue) break;

                if (targetValue.type === 'color') {
                  const r = Math.round(targetValue.r * 255);
                  const g = Math.round(targetValue.g * 255);
                  const b = Math.round(targetValue.b * 255);
                  resolvedValue = `rgb(${r}, ${g}, ${b})`;
                  colorSwatch = resolvedValue;
                  aliasChain.push(resolvedValue);
                  break;
                } else if (targetValue.type === 'alias') {
                  currentAliasId = targetValue.id;
                  aliasChain.push(targetValue.name);
                  resolutionDepth++;
                } else {
                  resolvedValue = String(targetValue.value);
                  aliasChain.push(resolvedValue);
                  break;
                }
              }
              valuesByMode[mode.modeId] = {
                value: valueStr,
                resolvedValue,
                colorSwatch,
                isAlias,
                aliasChain,
                aliasTargetId: valueObj.id,
              };
            } else if (valueObj.type === 'color') {
              const r = Math.round(valueObj.r * 255);
              const g = Math.round(valueObj.g * 255);
              const b = Math.round(valueObj.b * 255);
              valueStr = `rgb(${r}, ${g}, ${b})`;
              valuesByMode[mode.modeId] = {
                value: valueStr,
                resolvedValue: valueStr,
                colorSwatch: valueStr,
                isAlias: false,
              };
            } else {
              valueStr = String(valueObj.value);
              valuesByMode[mode.modeId] = {
                value: valueStr,
                resolvedValue: valueStr,
                isAlias: false,
              };
            }
          } else {
            valuesByMode[mode.modeId] = null;
          }
        });
      }

      return {
        id: t.id,
        name: t.name.split('/').pop() || t.name,
        path: t.name,
        type: t.resolvedType === 'FLOAT' ? 'number' : t.resolvedType.toLowerCase() as any,
        valuesByMode,
        description: t.description,
        scopes: (t as any).scopes,
        codeSyntax: (t as any).codeSyntax,
        hiddenFromPublishing: t.hiddenFromPublishing,
        collectionId: t.collectionId,
      };
    })
    : (mockVariables as any[]).map(v => ({
      id: v.id,
      name: v.name,
      path: v.path || v.name,
      type: v.type,
      valuesByMode: {
        'default': {
          value: v.value,
          resolvedValue: v.resolvedValue,
          colorSwatch: v.colorSwatch,
          isAlias: !!v.aliasTargetId,
          aliasTargetId: v.aliasTargetId
        }
      }
    }));

  const currentCollectionModes = realCollections.find(c => c.name === selectedCollection)?.modes || [{ modeId: 'default', name: 'Value' }];


  const selectedVariable = displayVariables.find((v) => v.id === selectedVariableId) || null;

  const handleRenameMode = (modeId: string, newName: string) => {
    const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
    if (collectionId) {
      parent.postMessage({
        pluginMessage: {
          type: 'rename-mode',
          collectionId,
          modeId,
          newName
        }
      }, '*');
    }
  };

  const handleCreateMode = () => {
    const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
    if (collectionId) {
      parent.postMessage({
        pluginMessage: {
          type: 'create-mode',
          collectionId
        }
      }, '*');
    }
  };

  const handleRenameCollection = (collectionId: string, newName: string) => {
    parent.postMessage({
      pluginMessage: {
        type: 'rename-collection',
        collectionId,
        newName
      }
    }, '*');
  };

  const handleDeleteCollection = (collectionId: string) => {
    parent.postMessage({
      pluginMessage: {
        type: 'delete-collection',
        collectionId
      }
    }, '*');
  };

  const handleRenameGroup = (oldFullName: string, newName: string) => {
    const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
    if (collectionId) {
      parent.postMessage({
        pluginMessage: {
          type: 'rename-group',
          collectionId,
          oldFullName,
          newName
        }
      }, '*');
    }
  };

  const handleDuplicateGroup = (fullName: string) => {
    const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
    if (collectionId) {
      parent.postMessage({
        pluginMessage: {
          type: 'duplicate-group',
          collectionId,
          fullName
        }
      }, '*');
    }
  };

  const handleDeleteGroup = (fullName: string) => {
    const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
    if (collectionId) {
      parent.postMessage({
        pluginMessage: {
          type: 'delete-group',
          collectionId,
          fullName
        }
      }, '*');
    }
  };

  const handleUngroupGroup = (fullName: string) => {
    const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
    if (collectionId) {
      parent.postMessage({
        pluginMessage: {
          type: 'ungroup-group',
          collectionId,
          fullName
        }
      }, '*');
    }
  };

  const handleUpdateVariable = (variableId: string, modeId: string, value: string) => {
    parent.postMessage({
      pluginMessage: {
        type: 'update-variable',
        variableId,
        modeId,
        value
      }
    }, '*');
  };

  const handleDuplicateVariables = (variableIds: string[]) => {
    parent.postMessage({
      pluginMessage: {
        type: 'duplicate-variables',
        variableIds
      }
    }, '*');
  };

  const handleDeleteVariables = (variableIds: string[]) => {
    parent.postMessage({
      pluginMessage: {
        type: 'delete-variables',
        variableIds
      }
    }, '*');
  };

  const handleNewGroupWithSelection = (variableIds: string[], groupName: string) => {
    parent.postMessage({
      pluginMessage: {
        type: 'create-group-from-selection',
        variableIds,
        groupName
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

  const handleImport = (payload: { mode: 'create' | 'update', data: any }) => {
    parent.postMessage({
      pluginMessage: {
        type: 'import-variables',
        payload
      }
    }, '*');
  };

  const handleCreateCollection = () => {
    parent.postMessage({
      pluginMessage: {
        type: 'create-collection'
      }
    }, '*');
  };

  const handleReorderCollections = (newOrder: string[]) => {
    setCustomCollectionOrder(newOrder);
    setIsSortedAlpha(false);
  };

  const toggleAlphaSort = () => {
    setIsSortedAlpha(!isSortedAlpha);
  };

  const handleSelectGroup = (fullName: string, multi?: { shift: boolean, ctrl: boolean }) => {
    setSelectedGroup(fullName);

    if (!multi || (!multi.shift && !multi.ctrl)) {
      setSelectedGroups([fullName]);
      return;
    }

    if (multi.ctrl) {
      setSelectedGroups(prev => {
        if (prev.includes(fullName)) return prev.filter(p => p !== fullName);
        return [...prev, fullName];
      });
    } else if (multi.shift) {
      // Find range in derivedGroups
      const allNames = derivedGroups.map(g => g.fullName);
      const lastSelected = selectedGroups[selectedGroups.length - 1] || "All";
      const idx1 = allNames.indexOf(lastSelected);
      const idx2 = allNames.indexOf(fullName);

      if (idx1 !== -1 && idx2 !== -1) {
        const range = allNames.slice(Math.min(idx1, idx2), Math.max(idx1, idx2) + 1);
        setSelectedGroups(Array.from(new Set([...selectedGroups, ...range])));
      }
    }
  };

  const handleMoveGroup = (sourceFullNames: string[], targetCollectionId: string, targetParentPath: string) => {
    parent.postMessage({
      pluginMessage: {
        type: 'move-group',
        sourceFullNames,
        targetCollectionId,
        targetParentPath
      }
    }, '*');
  };

  const handleMergeCollections = (sourceCollectionId: string, targetCollectionId: string) => {
    parent.postMessage({
      pluginMessage: {
        type: 'merge-collections',
        sourceCollectionId,
        targetCollectionId
      }
    }, '*');
  };

  const handleReorderGroups = (collectionId: string, newOrder: string[]) => {
    setCustomGroupOrder(prev => ({
      ...prev,
      [collectionId]: newOrder
    }));
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
            setSelectedGroups(["All"]);
          }}
          onSelectGroup={handleSelectGroup}
          selectedGroups={selectedGroups}
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
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onCreateCollection={handleCreateCollection}
          onReorderCollections={handleReorderCollections}
          onReorderGroups={handleReorderGroups}
          customGroupOrder={customGroupOrder}
          onSortAlpha={toggleAlphaSort}
          isSortedAlpha={isSortedAlpha}
          onMoveGroup={handleMoveGroup}
          onMergeCollections={handleMergeCollections}
          onRenameGroup={handleRenameGroup}
          onDuplicateGroup={handleDuplicateGroup}
          onDeleteGroup={handleDeleteGroup}
          onUngroupGroup={handleUngroupGroup}
        />
      </div>

      {/* Center — Variables table */}
      <VariablesTable
        variables={displayVariables}
        modes={currentCollectionModes}
        selectedId={selectedVariableId}
        selectedIds={selectedVariableIds}
        onSelect={(id, multi) => {
          if (!multi || (!multi.shift && !multi.ctrl)) {
            setSelectedVariableId(id);
            setSelectedVariableIds([id]);
          } else if (multi.ctrl) {
            setSelectedVariableIds(prev => {
              if (prev.includes(id)) {
                const newIds = prev.filter(i => i !== id);
                setSelectedVariableId(newIds.length > 0 ? newIds[0] : null);
                return newIds;
              }
              return [...prev, id];
            });
          } else if (multi.shift) {
            // Range selection
            const allIds = displayVariables.map(v => v.id);
            const lastSelected = selectedVariableIds[selectedVariableIds.length - 1] || selectedVariableId;
            const idx1 = lastSelected ? allIds.indexOf(lastSelected) : -1;
            const idx2 = allIds.indexOf(id);

            if (idx1 !== -1 && idx2 !== -1) {
              const range = allIds.slice(Math.min(idx1, idx2), Math.max(idx1, idx2) + 1);
              setSelectedVariableIds(prev => Array.from(new Set([...prev, ...range])));
            }
          }
        }}
        onGitSyncClick={() => setShowGitSyncModal(true)}
        onMinimizeClick={handleMinimize}
        onNavigateToTarget={handleNavigateToTarget}
        navigationReturn={navigationReturn}
        onClearNavigationReturn={() => setNavigationReturn(null)}
        onRenameMode={handleRenameMode}
        onCreateMode={handleCreateMode}
        onUpdateVariable={handleUpdateVariable}
        onDuplicateMode={(modeId) => {
          const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
          if (collectionId) {
            parent.postMessage({ pluginMessage: { type: 'duplicate-mode', collectionId, modeId } }, '*');
          }
        }}
        onDeleteMode={(modeId) => {
          const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
          if (collectionId) {
            parent.postMessage({ pluginMessage: { type: 'delete-mode', collectionId, modeId } }, '*');
          }
        }}
        onReorderModes={(modeIds) => {
          const collectionId = realCollections.find(c => c.name === selectedCollection)?.id;
          if (collectionId) {
            parent.postMessage({ pluginMessage: { type: 'reorder-modes', collectionId, modeIds } }, '*');
          }
        }}
        onDuplicateVariables={handleDuplicateVariables}
        onDeleteVariables={handleDeleteVariables}
        onNewGroupWithSelection={handleNewGroupWithSelection}
        onEditVariable={() => setActiveDetailTab('scope')}
        onImportClick={() => setShowImportModal(true)}
        onExportClick={() => setShowExportModal(true)}
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
        variables={selectedVariableIds.length > 1
          ? displayVariables.filter(v => selectedVariableIds.includes(v.id))
          : selectedVariable
            ? [selectedVariable]
            : []}
        groupName={selectedGroup}
        collapsed={detailsCollapsed}
        modes={currentCollectionModes}
        collections={displayCollections}
        activeTab={activeDetailTab}
        onActiveTabChange={setActiveDetailTab}
        onToggleCollapse={() => setDetailsCollapsed(!detailsCollapsed)}
        onUpdateName={(variableId, newName) => {
          parent.postMessage({
            pluginMessage: {
              type: 'update-variable-name',
              variableId,
              newName
            }
          }, '*');
        }}
        onUpdateDescription={(variableId, description) => {
          parent.postMessage({
            pluginMessage: {
              type: 'update-variable-description',
              variableId,
              description
            }
          }, '*');
        }}
        onUpdateHidden={(variableId, hidden) => {
          parent.postMessage({
            pluginMessage: {
              type: 'update-variable-hidden',
              variableId,
              hidden
            }
          }, '*');
        }}
        onUpdateValue={(variableId, modeId, value) => {
          parent.postMessage({
            pluginMessage: {
              type: 'update-variable',
              variableId,
              modeId,
              value
            }
          }, '*');
        }}
        onUpdateCodeSyntax={(variableId, codeSyntax) => {
          parent.postMessage({
            pluginMessage: {
              type: 'update-variable-code-syntax',
              variableId,
              codeSyntax
            }
          }, '*');
        }}
        onUpdateScopes={(variableIds, scopes) => {
          parent.postMessage({
            pluginMessage: {
              type: 'update-variable-scopes',
              variableIds,
              scopes
            }
          }, '*');
        }}
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