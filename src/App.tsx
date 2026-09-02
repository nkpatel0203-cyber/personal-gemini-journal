import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Star,
  Sparkles,
  Calendar,
  Compass,
  ArrowUpDown,
  BookHeart,
  Flame,
  Feather,
  SlidersHorizontal,
  X,
  Cloud,
  CloudOff,
  User as UserIcon,
} from 'lucide-react';
import { JournalEntry, MoodType } from './types';
import {
  getStoredEntries,
  saveSingleEntry,
  deleteEntryById,
  toggleFavoriteById,
  calculateJournalStreak,
  saveEntries,
} from './services/storageService';
import {
  subscribeToUserEntries,
  saveEntryToFirestore,
  deleteEntryFromFirestore,
  toggleFavoriteInFirestore,
} from './services/firestoreService';
import { useAuth } from './context/AuthContext';
import { MOOD_CONFIGS } from './data/initialEntries';
import { Navbar } from './components/Navbar';
import { EntryCard } from './components/EntryCard';
import { EntryEditor } from './components/EntryEditor';
import { EntryDetailModal } from './components/EntryDetailModal';
import { PromptModal } from './components/PromptModal';
import { WeeklySynthesisModal } from './components/WeeklySynthesisModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Modals
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);
  const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Real-time synchronization: If signed in, subscribe to Firestore subcollection; else read localStorage
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const unsubscribe = subscribeToUserEntries(
        user.uid,
        (syncedEntries) => {
          setEntries(syncedEntries);
          // Mirror in local storage for offline resilience
          saveEntries(syncedEntries);
        },
        (err) => {
          console.error('Failed to sync entries with Firestore, falling back to local:', err);
          const loaded = getStoredEntries();
          setEntries(loaded);
        }
      );
      return () => unsubscribe();
    } else {
      const loaded = getStoredEntries();
      setEntries(loaded);
    }
  }, [user, authLoading]);

  const streak = useMemo(() => calculateJournalStreak(entries), [entries]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [entries]);

  // Filtered & Sorted entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = entry.title?.toLowerCase().includes(q);
          const matchContent = entry.content?.toLowerCase().includes(q);
          const matchLocation = entry.location?.toLowerCase().includes(q);
          const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchLocation && !matchTags) {
            return false;
          }
        }

        // Mood filter
        if (selectedMoodFilter !== 'all' && entry.mood !== selectedMoodFilter) {
          return false;
        }

        // Tag filter
        if (selectedTagFilter !== 'all' && !entry.tags?.includes(selectedTagFilter)) {
          return false;
        }

        // Favorites filter
        if (favoritesOnly && !entry.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [entries, searchQuery, selectedMoodFilter, selectedTagFilter, favoritesOnly, sortOrder]);

  // Handlers
  const handleNewEntry = (initialPrompt?: string, suggestedMood?: MoodType) => {
    setEditingEntry({
      id: '',
      title: '',
      content: initialPrompt ? `${initialPrompt}\n\n` : '',
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mood: suggestedMood || 'reflective',
      tags: [],
      isFavorite: false,
    });
    setActiveView('editor');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setActiveView('editor');
  };

  const handleSaveEntry = async (savedEntry: JournalEntry) => {
    if (user) {
      await saveEntryToFirestore(user.uid, savedEntry);
    } else {
      const updatedList = saveSingleEntry(savedEntry);
      setEntries(updatedList);
    }
    setActiveView('list');
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id: string) => {
    if (user) {
      await deleteEntryFromFirestore(user.uid, id);
    } else {
      const updated = deleteEntryById(id);
      setEntries(updated);
    }
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    if (user) {
      await toggleFavoriteInFirestore(user.uid, id, entry.isFavorite);
    } else {
      const updated = toggleFavoriteById(id);
      setEntries(updated);
      if (selectedEntry?.id === id) {
        setSelectedEntry(updated.find((e) => e.id === id) || null);
      }
    }
  };

  const handleUpdateEntryInState = async (updatedEntry: JournalEntry) => {
    if (user) {
      await saveEntryToFirestore(user.uid, updatedEntry);
    } else {
      const updatedList = saveSingleEntry(updatedEntry);
      setEntries(updatedList);
    }
    setSelectedEntry(updatedEntry);
  };

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#24292f] flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Navbar */}
      <Navbar
        entryCount={entries.length}
        streak={streak}
        onNewEntry={() => handleNewEntry()}
        onOpenPrompts={() => setIsPromptsModalOpen(true)}
        onOpenSynthesis={() => setIsSynthesisModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenExportImport={() => setIsExportImportModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        hasEntries={entries.length > 0}
        isCloudSynced={Boolean(user)}
      />

      {/* Main View Router */}
      {activeView === 'editor' ? (
        <EntryEditor
          initialEntry={editingEntry?.id ? editingEntry : editingEntry?.content ? editingEntry : null}
          onSave={handleSaveEntry}
          onCancel={() => {
            setActiveView('list');
            setEditingEntry(null);
          }}
          onOpenPromptsModal={() => setIsPromptsModalOpen(true)}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Atmospheric Header & Spark Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-100/70 via-stone-100/60 to-indigo-100/50 border border-amber-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Feather className="w-3.5 h-3.5 text-amber-700" />
                  {greeting} {user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''} • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
                  What is present for you today?
                </h2>
                <p className="text-xs sm:text-sm text-stone-700 font-serif-display leading-relaxed">
                  A sanctuary for unfiltered reflections, illuminated by Gemini's empathetic psychological insights, Socratic questions, and persistent cloud storage.
                </p>
              </div>

              {/* Quick Actions Card */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <button
                  id="hero-prompts-btn"
                  type="button"
                  onClick={() => setIsPromptsModalOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-white/90 hover:bg-white text-stone-800 border border-stone-200/80 shadow-2xs hover:shadow-xs text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Explore Prompts</span>
                </button>

                <button
                  id="hero-write-btn"
                  type="button"
                  onClick={() => handleNewEntry()}
                  className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-500/30 shadow-xs hover:shadow-md text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Write Reflection</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search, Mood Filter, Tag Filter, and Sort Controls */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-journal-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries, thoughts, locations, tags..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Favorites Toggle */}
                <button
                  id="filter-favorites-toggle"
                  type="button"
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    favoritesOnly
                      ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-white border-stone-200/90 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}`} />
                  <span>Saved Stars</span>
                </button>

                {/* Sort Order */}
                <button
                  id="filter-sort-order"
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200/90 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                  <span>{sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</span>
                </button>
              </div>
            </div>

            {/* Mood Pills Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedMoodFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedMoodFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                All Moods ({entries.length})
              </button>

              {Object.values(MOOD_CONFIGS).map((config) => {
                const count = entries.filter((e) => e.mood === config.id).length;
                const isSelected = selectedMoodFilter === config.id;
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setSelectedMoodFilter(config.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? `${config.badgeBg} ${config.textColor} ring-2 ring-amber-400 font-semibold shadow-xs`
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                    <span className="text-[10px] opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Tags Pills if any */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-stone-400 text-[11px] font-medium uppercase tracking-wider pl-1">Tags:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    selectedTagFilter === 'all'
                      ? 'bg-amber-100 text-amber-900 font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? 'all' : tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedTagFilter === tag
                        ? 'bg-amber-200 text-amber-950 font-semibold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entries Grid */}
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onSelect={(selected) => setSelectedEntry(selected)}
                  onEdit={() => handleEditEntry(entry)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                  onToggleFavorite={() => handleToggleFavorite(entry.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-4 max-w-md mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
                <BookHeart className="w-8 h-8 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h3 className="font-editorial text-2xl font-bold text-stone-900">
                  {entries.length === 0 ? 'Your journal is a blank canvas' : 'No matching entries found'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-serif-display leading-relaxed">
                  {entries.length === 0
                    ? 'Begin with a quiet breath. Pour out what is genuine, raw, or inspiring.'
                    : 'Try clearing your search query or mood filter to explore your archived reflections.'}
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                {entries.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedMoodFilter('all');
                      setSelectedTagFilter('all');
                      setFavoritesOnly(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNewEntry()}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Write First Entry
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Entry Detail & Reflection Modal */}
      <EntryDetailModal
        entry={selectedEntry}
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        onEdit={handleEditEntry}
        onUpdateEntry={handleUpdateEntryInState}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Prompts Generator Modal */}
      <PromptModal
        isOpen={isPromptsModalOpen}
        onClose={() => setIsPromptsModalOpen(false)}
        onSelectPrompt={(promptText, suggestedMood) => {
          handleNewEntry(promptText, suggestedMood);
        }}
      />

      {/* Weekly Synthesis Modal */}
      <WeeklySynthesisModal
        entries={entries}
        isOpen={isSynthesisModalOpen}
        onClose={() => setIsSynthesisModalOpen(false)}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        entries={entries}
        streak={streak}
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      {/* Export / Backup & Privacy Modal */}
      <ExportImportModal
        entries={entries}
        isOpen={isExportImportModalOpen}
        onClose={() => setIsExportImportModalOpen(false)}
        onEntriesUpdated={(updated) => setEntries(updated)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
