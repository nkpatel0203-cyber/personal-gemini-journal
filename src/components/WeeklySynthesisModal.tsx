import React, { useState } from 'react';
import {
  Sparkles,
  X,
  RefreshCw,
  Award,
  Heart,
  Calendar,
  Compass,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AIWeeklySynthesis, JournalEntry } from '../types';
import { fetchPeriodicSynthesis } from '../services/geminiService';

interface WeeklySynthesisModalProps {
  entries: JournalEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklySynthesisModal: React.FC<WeeklySynthesisModalProps> = ({
  entries,
  isOpen,
  onClose,
}) => {
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | 'all'>('7days');
  const [synthesis, setSynthesis] = useState<AIWeeklySynthesis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getFilteredEntries = () => {
    const now = Date.now();
    if (timeframe === '7days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      return entries.filter((e) => new Date(e.date).getTime() >= sevenDaysAgo);
    } else if (timeframe === '30days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return entries.filter((e) => new Date(e.date).getTime() >= thirtyDaysAgo);
    }
    return entries;
  };

  const targetEntries = getFilteredEntries();

  const handleGenerateSynthesis = async () => {
    if (targetEntries.length === 0) {
      setError('No journal entries found in this timeframe to synthesize.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const timeframeLabel =
      timeframe === '7days'
        ? 'Past 7 Days'
        : timeframe === '30days'
        ? 'Past 30 Days'
        : 'All Recent Journal Entries';

    try {
      const res = await fetchPeriodicSynthesis(targetEntries, timeframeLabel);
      setSynthesis(res);
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (e: any) {
      console.error('Synthesis error:', e);
      setError(e?.message || 'Failed to generate weekly synthesis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="synthesis-modal-overlay"
      className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="synthesis-modal-container"
        className="bg-[#faf8f5] w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-900">
                AI Emotional Landscape & Synthesis
              </h3>
              <p className="text-xs text-stone-500">
                Holistic trajectory, breakthroughs, and personalized affirmations
              </p>
            </div>
          </div>
          <button
            id="close-synthesis-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe Controls */}
        <div className="p-4 sm:p-5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600">Timeframe:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTimeframe('7days');
                  setSynthesis(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  timeframe === '7days'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                Past 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeframe('30days');
                  setSynthesis(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  timeframe === '30days'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                Past 30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeframe('all');
                  setSynthesis(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  timeframe === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                All ({entries.length})
              </button>
            </div>
          </div>

          <button
            id="generate-synthesis-btn"
            type="button"
            onClick={handleGenerateSynthesis}
            disabled={isLoading || targetEntries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synthesizing with Gemini...' : `Synthesize ${targetEntries.length} Entries`}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 space-y-5 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {!synthesis && !isLoading && (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7 text-indigo-600" />
              </div>
              <h4 className="font-editorial text-xl font-bold text-stone-800">
                Ready for your holistic reflection
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                Gemini will read across your {targetEntries.length} entries to identify recurring thought loops, emotional trajectories, personal growth milestones, and craft a bespoke affirmation.
              </p>
              <button
                type="button"
                onClick={handleGenerateSynthesis}
                disabled={targetEntries.length === 0}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Begin Period Synthesis</span>
              </button>
            </div>
          )}

          {synthesis && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Bespoke Affirmation Banner */}
              {synthesis.affirmation && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-100/90 via-amber-50 to-orange-50/80 border border-amber-300/80 text-center space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1">
                    <Quote className="w-3.5 h-3.5 text-amber-700" />
                    Personal Mantra & Affirmation
                  </span>
                  <p className="text-base sm:text-lg font-serif-display font-bold italic text-amber-950 leading-snug">
                    "{synthesis.affirmation}"
                  </p>
                </div>
              )}

              {/* Dominant Themes */}
              {synthesis.dominantThemes && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Recurring Psychological Themes
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {synthesis.dominantThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200"
                      >
                        • {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional Arc Narrative */}
              {synthesis.emotionalArc && (
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Your Emotional Trajectory
                  </span>
                  <p className="text-xs sm:text-sm text-stone-700 font-serif-display leading-relaxed">
                    {synthesis.emotionalArc}
                  </p>
                </div>
              )}

              {/* Growth Celebrations */}
              {synthesis.growthCelebrations && synthesis.growthCelebrations.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Milestones & Growth Celebrations
                  </span>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                    {synthesis.growthCelebrations.map((cel, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{cel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compassionate Nudge */}
              {synthesis.compassionateNudge && (
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-indigo-600" />
                    Mindful Compassionate Nudge
                  </span>
                  <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                    {synthesis.compassionateNudge}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
