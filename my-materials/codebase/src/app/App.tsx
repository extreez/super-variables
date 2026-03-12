import React, { useState } from "react";
import { Sidebar } from "./components/sidebar";
import { VariablesTable } from "./components/variables-table";
import { VariableDetails } from "./components/variable-details";
import { ExportModal } from "./components/export-modal";
import { ImportModal } from "./components/import-modal";
import { GitSyncModal } from "./components/git-sync-modal";
import {
  collections,
  groups,
  semanticVariables,
} from "./components/variables-data";

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

  const selectedVariable =
    semanticVariables.find((v) => v.id === selectedVariableId) || null;

  const handleImport = (data: any) => {
    console.log("Importing data:", data);
    // TODO: Process imported data
  };

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
          collections={collections}
          groups={groups}
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
        variables={semanticVariables}
        selectedId={selectedVariableId}
        onSelect={(id) => {
          setSelectedVariableId(id);
        }}
        onGitSyncClick={() => setShowGitSyncModal(true)}
      />

      {/* Right — Details panel */}
      <VariableDetails
        variable={selectedVariable}
        groupName="Semantics"
        collapsed={detailsCollapsed}
        onToggleCollapse={() => setDetailsCollapsed(!detailsCollapsed)}
      />

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        collections={collections}
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