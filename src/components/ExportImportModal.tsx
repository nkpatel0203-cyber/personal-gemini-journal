import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  FileJson,
  FileText,
  Trash2,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { JournalEntry } from '../types';
import {
  exportEntriesAsJson,
  exportEntriesAsMarkdown,
  saveEntries,
} from '../services/storageService';
import { batchImportEntriesToFirestore, deleteEntryFromFirestore } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

interface ExportImportModalProps {
  entries: JournalEntry[];
  isOpen: boolean;
  onClose: () => void;
  onEntriesUpdated: (updated: JournalEntry[]) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  entries,
  isOpen,
  onClose,
  onEntriesUpdated,
}) => {
  const { user } = useAuth();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].content !== undefined) {
          if (user) {
            await batchImportEntriesToFirestore(user.uid, parsed);
          } else {
            saveEntries(parsed);
          }
          onEntriesUpdated(parsed);
          setStatusMessage({
            text: `Successfully imported ${parsed.length} journal entries!`,
            type: 'success',
          });
        } else {
          setStatusMessage({
            text: 'Invalid file format. Please upload a valid Gemini Journal JSON backup.',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Failed to parse backup JSON', err);
        setStatusMessage({
          text: 'Failed to read file. Please ensure it is valid JSON.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (user) {
      const promises = entries.map((e) => deleteEntryFromFirestore(user.uid, e.id));
      await Promise.all(promises);
    } else {
      saveEntries([]);
    }
    onEntriesUpdated([]);
    setShowClearConfirm(false);
    setStatusMessage({
      text: 'All journal entries have been cleared.',
      type: 'success',
    });
  };

  const handleSyncLocalToFirestore = async () => {
    if (!user) return;
    setIsSyncingToCloud(true);
    try {
      await batchImportEntriesToFirestore(user.uid, entries);
      setStatusMessage({
        text: `Uploaded ${entries.length} local entries to your cloud Firestore database!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      setStatusMessage({
        text: 'Failed to sync to Firestore: ' + (err?.message || 'Unknown error'),
        type: 'error',
      });
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  return (
    <div
      id="export-import-modal-overlay"
      className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="export-import-modal-container"
        className="bg-[#faf8f5] w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Download className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-900">
                Backup, Export & Privacy
              </h3>
              <p className="text-xs text-stone-500">
                Full sovereignty over your reflections, Firestore sync & insights
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-stone-700">
              <span className="font-bold text-stone-900 block">
                {user ? `Connected to Firestore (${user.email})` : 'Offline / Local-First Mode'}
              </span>
              <p className="leading-relaxed">
                {user
                  ? 'Your entries are encrypted and stored in your isolated Firestore collection with granular security rules.'
                  : 'Your entries are stored locally in your browser. Sign in to seamlessly sync and protect them across devices.'}
              </p>
            </div>
          </div>

          {/* Sync Button if User is authenticated */}
          {user && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  Cloud Firestore Sync
                </span>
                <p className="text-[11px] text-stone-600">
                  Force synchronize all current {entries.length} entries to Firestore.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncLocalToFirestore}
                disabled={isSyncingToCloud}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isSyncingToCloud ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Export Archive ({entries.length} entries)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="export-json-btn"
                type="button"
                onClick={() => exportEntriesAsJson(entries)}
                className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <FileJson className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-stone-900 text-sm">JSON Backup</span>
                </div>
                <p className="text-xs text-stone-500">
                  Full raw backup with AI reflections and chat histories for easy re-import.
                </p>
              </button>

              <button
                id="export-markdown-btn"
                type="button"
                onClick={() => exportEntriesAsMarkdown(entries)}
                className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-stone-900 text-sm">Markdown File</span>
                </div>
                <p className="text-xs text-stone-500">
                  Formatted for Obsidian, Notion, or reading in any markdown text reader.
                </p>
              </button>
            </div>
          </div>

          {/* Restore / Import */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Restore from Backup
            </h4>
            <div className="p-4 rounded-2xl bg-white border border-dashed border-stone-300 text-center space-y-2">
              <Upload className="w-6 h-6 text-stone-400 mx-auto" />
              <div>
                <p className="text-xs text-stone-600 font-medium">
                  Upload a previously saved `.json` journal backup
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <button
                id="upload-backup-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Select Backup File
              </button>
            </div>
          </div>

          {/* Reset Danger Zone */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Danger Zone
            </h4>

            {showClearConfirm ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <p className="text-xs text-rose-900 font-medium">
                  Are you sure? This will delete all {entries.length} entries. Please ensure you have exported a backup first!
                </p>
                <div className="flex gap-2">
                  <button
                    id="confirm-clear-all-btn"
                    type="button"
                    onClick={handleClearAll}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="start-clear-all-btn"
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200/80 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Journal Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
