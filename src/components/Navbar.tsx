import React from 'react';
import {
  Sparkles,
  Plus,
  Flame,
  BarChart3,
  Compass,
  Download,
  BookOpen,
  Feather,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  entryCount: number;
  streak: number;
  onNewEntry: () => void;
  onOpenPrompts: () => void;
  onOpenSynthesis: () => void;
  onOpenAnalytics: () => void;
  onOpenExportImport: () => void;
  onOpenAuth: () => void;
  hasEntries: boolean;
  isCloudSynced: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  entryCount,
  streak,
  onNewEntry,
  onOpenPrompts,
  onOpenSynthesis,
  onOpenAnalytics,
  onOpenExportImport,
  onOpenAuth,
  hasEntries,
  isCloudSynced,
}) => {
  const { user, signOut } = useAuth();

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 bg-[#faf8f5]/90 backdrop-blur-md border-b border-stone-200/80 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs shadow-amber-900/10">
            <Feather className="w-5 h-5 text-amber-50" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-2xl font-bold tracking-tight text-stone-900 leading-none">
                Gemini Journal
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-800 border border-amber-200/80">
                <Sparkles className="w-3 h-3 text-amber-600" />
                AI + Firestore
              </span>
            </div>
            <p className="text-xs text-stone-700 hidden sm:block">
              Authenticated reflective space powered by Gemini & Google Cloud
            </p>
          </div>
        </div>

        {/* Quick Stats & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status Indicator */}
          {user ? (
            <div
              id="cloud-sync-badge"
              title="Synced with Cloud Firestore in real-time"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloud Synced</span>
            </div>
          ) : (
            <div
              id="local-only-badge"
              onClick={onOpenAuth}
              title="Click to sign in and back up to Firestore"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200 text-amber-800 text-[11px] font-medium cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Local (Sign In)</span>
            </div>
          )}

          {/* Streak indicator */}
          <div
            id="streak-badge"
            title={`${streak} day journaling streak`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{streak}d streak</span>
          </div>

          {/* Entry count */}
          <div
            id="entry-count-badge"
            title={`${entryCount} total entries recorded`}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
          </div>

          {/* Prompts Generator */}
          <button
            id="nav-btn-prompts"
            type="button"
            onClick={onOpenPrompts}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200 transition-all cursor-pointer shadow-2xs"
            title="Get personalized mindful prompts"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Prompts</span>
          </button>

          {/* Weekly Synthesis */}
          <button
            id="nav-btn-synthesis"
            type="button"
            onClick={onOpenSynthesis}
            disabled={!hasEntries}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200/90 hover:bg-indigo-50/60 hover:text-indigo-900 hover:border-indigo-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Generate AI weekly emotional synthesis"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">AI Synthesis</span>
          </button>

          {/* Analytics */}
          <button
            id="nav-btn-analytics"
            type="button"
            onClick={onOpenAnalytics}
            disabled={!hasEntries}
            className="p-2 rounded-xl text-stone-600 bg-white border border-stone-200/90 hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="View Journal Insights & Mood Distribution"
          >
            <BarChart3 className="w-4 h-4 text-stone-700" />
          </button>

          {/* Export / Backup */}
          <button
            id="nav-btn-export-import"
            type="button"
            onClick={onOpenExportImport}
            className="p-2 rounded-xl text-stone-600 bg-white border border-stone-200/90 hover:bg-stone-100 transition-all cursor-pointer shadow-2xs"
            title="Export, Backup & Data Privacy"
          >
            <Download className="w-4 h-4 text-stone-700" />
          </button>

          {/* User Auth Profile / Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-white border border-stone-200 text-xs text-stone-800"
                title={`Signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px]">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="font-semibold max-w-[90px] truncate hidden xl:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  id="nav-logout-btn"
                  type="button"
                  onClick={signOut}
                  className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              id="nav-signin-btn"
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-amber-50 hover:text-amber-950 transition-colors cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-700" />
              <span>Sign In</span>
            </button>
          )}

          {/* New Entry CTA */}
          <button
            id="nav-btn-new-entry"
            type="button"
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Write</span>
          </button>
        </div>
      </div>
    </header>
  );
};
