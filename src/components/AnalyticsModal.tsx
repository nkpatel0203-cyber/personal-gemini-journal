import React from 'react';
import {
  BarChart3,
  X,
  Flame,
  BookOpen,
  Sparkles,
  Heart,
  Calendar,
  FileText,
  Tag,
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';
import { MOOD_CONFIGS } from '../data/initialEntries';

interface AnalyticsModalProps {
  entries: JournalEntry[];
  streak: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  entries,
  streak,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const totalEntries = entries.length;
  const totalWords = entries.reduce((acc, e) => {
    return acc + (e.content ? e.content.trim().split(/\s+/).length : 0);
  }, 0);
  const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
  const reflectedCount = entries.filter((e) => e.aiReflection).length;
  const totalGratitudes = entries.reduce((acc, e) => acc + (e.gratitudes?.length || 0), 0);

  // Mood counts
  const moodCounts: Partial<Record<MoodType, number>> = {};
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  // Tag counts
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const moodsList = Object.values(MOOD_CONFIGS);

  return (
    <div
      id="analytics-modal-overlay"
      className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="analytics-modal-container"
        className="bg-[#faf8f5] w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-900">
                Journal Insights & Habits
              </h3>
              <p className="text-xs text-stone-500">
                Emotional landscape metrics, consistency, and vocabulary volume
              </p>
            </div>
          </div>
          <button
            id="close-analytics-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 text-center space-y-1 shadow-2xs">
              <div className="flex justify-center text-orange-500">
                <Flame className="w-5 h-5 fill-orange-500" />
              </div>
              <div className="text-2xl font-bold font-mono-code text-stone-900">{streak}</div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase">Day Streak</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 text-center space-y-1 shadow-2xs">
              <div className="flex justify-center text-stone-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold font-mono-code text-stone-900">{totalEntries}</div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase">Total Entries</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 text-center space-y-1 shadow-2xs">
              <div className="flex justify-center text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold font-mono-code text-stone-900">{totalWords.toLocaleString()}</div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase">Words Written</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 text-center space-y-1 shadow-2xs">
              <div className="flex justify-center text-amber-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold font-mono-code text-stone-900">{reflectedCount}</div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase">AI Reflections</div>
            </div>
          </div>

          {/* Secondary stats row */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-wrap items-center justify-around gap-4 text-xs">
            <div className="text-center">
              <span className="text-stone-500 block">Avg Words / Entry</span>
              <span className="font-bold text-stone-900 text-sm font-mono-code">
                {avgWordsPerEntry} words
              </span>
            </div>
            <div className="text-center">
              <span className="text-stone-500 block">Gratitudes Logged</span>
              <span className="font-bold text-amber-900 text-sm font-mono-code">
                {totalGratitudes} sparks
              </span>
            </div>
            <div className="text-center">
              <span className="text-stone-500 block">Reflective Coverage</span>
              <span className="font-bold text-indigo-900 text-sm font-mono-code">
                {totalEntries > 0 ? Math.round((reflectedCount / totalEntries) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Mood Distribution */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Emotional Balance & Mood Spectrum
            </h4>
            <div className="space-y-2.5">
              {moodsList.map((m) => {
                const count = moodCounts[m.id] || 0;
                const percentage = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
                return (
                  <div key={m.id} className="space-y-1">
                    <div className="flex justify-between text-xs text-stone-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </span>
                      <span className="font-mono-code text-stone-500">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.dotColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Themes & Tags */}
          {topTags.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                Frequently Explored Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200"
                  >
                    <span>#{tag}</span>
                    <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-full font-mono-code font-bold">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
