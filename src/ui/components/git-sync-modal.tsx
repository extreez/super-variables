import React, { useState } from "react";
import { X, GitBranch, Check, AlertCircle, RefreshCw } from "lucide-react";

interface GitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitSyncModal({ isOpen, onClose }: GitSyncModalProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [token, setToken] = useState("");
  const [filePath, setFilePath] = useState("tokens.json");
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState("30");
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!repoUrl || !token) {
      return;
    }

    setIsSyncing(true);
    // Simulate connection
    setTimeout(() => {
      setIsConnected(true);
      setIsSyncing(false);
      setLastSync(new Date().toLocaleString());
    }, 1500);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(new Date().toLocaleString());
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setRepoUrl("");
    setToken("");
    setLastSync(null);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-[#666]" />
            <h2 className="text-sm font-medium text-[#333]">Git Synchronization</h2>
          </div>
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
            {/* Connection Status */}
            {isConnected && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                <Check size={14} className="text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-green-700 font-medium">Connected to repository</p>
                  {lastSync && (
                    <p className="text-[10px] text-green-600 mt-0.5">
                      Last synced: {lastSync}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Repository URL */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo.git"
                disabled={isConnected}
                className="w-full px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] disabled:bg-[#f5f5f5] disabled:text-[#999]"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                disabled={isConnected}
                className="w-full px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] disabled:bg-[#f5f5f5] disabled:text-[#999]"
              />
            </div>

            {/* Access Token */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                disabled={isConnected}
                className="w-full px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] disabled:bg-[#f5f5f5] disabled:text-[#999]"
              />
              <p className="text-[10px] text-[#999] mt-1">
                Generate a personal access token with repo permissions
              </p>
            </div>

            {/* File Path */}
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider mb-2 block">
                File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="tokens.json"
                disabled={isConnected}
                className="w-full px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff] disabled:bg-[#f5f5f5] disabled:text-[#999]"
              />
            </div>

            {/* Auto Sync */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#ccc] text-[#0d99ff] focus:ring-[#0d99ff] cursor-pointer"
                />
                <span className="text-[11px] text-[#333]">Enable Auto Sync</span>
              </label>

              {autoSync && (
                <div>
                  <label className="text-[11px] text-[#666] mb-1.5 block">
                    Sync Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    min="1"
                    max="1440"
                    className="w-full px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#0d99ff]"
                  />
                </div>
              )}
            </div>

            {/* Warning */}
            {!isConnected && repoUrl && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <AlertCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-700">
                  Make sure your access token has the necessary permissions to read and write to this repository.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e5e5]">
          <div>
            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="text-[11px] text-red-600 hover:text-red-700 cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] text-[#666] hover:text-[#333] cursor-pointer"
            >
              Close
            </button>
            {isConnected ? (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer ${
                  isSyncing
                    ? "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
                    : "bg-[#0d99ff] text-white hover:bg-[#0c8ae6]"
                }`}
              >
                <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={!repoUrl || !token || isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded cursor-pointer ${
                  !repoUrl || !token || isSyncing
                    ? "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
                    : "bg-[#0d99ff] text-white hover:bg-[#0c8ae6]"
                }`}
              >
                <GitBranch size={12} />
                {isSyncing ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
