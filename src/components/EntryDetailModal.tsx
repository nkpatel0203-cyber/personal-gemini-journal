import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Edit3,
  Star,
  Calendar,
  MapPin,
  CloudSun,
  Volume2,
  VolumeX,
  MessageSquare,
  RefreshCw,
  Heart,
  Lightbulb,
  HelpCircle,
  TrendingUp,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { JournalEntry, MoodType } from '../types';
import { MOOD_CONFIGS } from '../data/initialEntries';
import { fetchAIReflection } from '../services/geminiService';
import { CompanionChatDrawer } from './CompanionChatDrawer';
import { speakText, stopSpeaking } from '../utils/speechRecognition';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  onToggleFavorite: (id: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onUpdateEntry,
  onToggleFavorite,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCompanionChatOpen, setIsCompanionChatOpen] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const moodConfig = MOOD_CONFIGS[entry.mood] || MOOD_CONFIGS.reflective;
  const formattedDate = new Date(entry.date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(entry.date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${entry.title}. ${entry.content}. ${
      entry.aiReflection?.summary ? `Gemini's reflection: ${entry.aiReflection.summary}` : ''
    }`;

    setIsSpeaking(true);
    speakText(textToRead, () => {
      setIsSpeaking(false);
    });
  };

  const handleGenerateOrRefreshReflection = async () => {
    setIsGeneratingReflection(true);
    setReflectionError(null);

    try {
      const reflection = await fetchAIReflection(entry);
      const updated: JournalEntry = {
        ...entry,
        aiReflection: reflection,
      };
      onUpdateEntry(updated);
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (e: any) {
      console.error('Failed to generate reflection:', e);
      setReflectionError(e?.message || 'Failed to generate reflection');
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  return (
    <div
      id="entry-detail-overlay"
      className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="entry-detail-container"
        className="bg-[#faf8f5] w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-200/80 bg-white/70 backdrop-blur-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${moodConfig.badgeBg}`}
            >
              <span>{moodConfig.emoji}</span>
              <span>{moodConfig.label}</span>
            </span>

            <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{formattedDate}</span>
              <span className="text-stone-300">•</span>
              <span>{formattedTime}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Read Aloud TTS */}
            <button
              id="detail-speak-btn"
              type="button"
              onClick={handleSpeak}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
              title={isSpeaking ? 'Stop voice reading' : 'Listen to entry read aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-800" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Favorite */}
            <button
              id={`detail-fav-btn-${entry.id}`}
              type="button"
              onClick={() => onToggleFavorite(entry.id)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                entry.isFavorite
                  ? 'bg-amber-50 border-amber-200 text-amber-500'
                  : 'bg-white border-stone-200 text-stone-400 hover:text-stone-700'
              }`}
              title="Toggle Favorite"
            >
              <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Edit */}
            <button
              id="detail-edit-btn"
              type="button"
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Close */}
            <button
              id="detail-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Title & Metadata chips */}
          <div>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
              {entry.title || 'Untitled Reflection'}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stone-500">
              {entry.location && (
                <span className="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-md">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{entry.location}</span>
                </span>
              )}
              {entry.weather && (
                <span className="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-md">
                  <CloudSun className="w-3.5 h-3.5 text-stone-400" />
                  <span>{entry.weather}</span>
                </span>
              )}
            </div>
          </div>

          {/* Intention and Gratitude Boxes if present */}
          {(entry.dailyIntention || (entry.gratitudes && entry.gratitudes.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entry.dailyIntention && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                    Daily Intention
                  </span>
                  <p className="italic font-serif-display font-medium text-sm">
                    "{entry.dailyIntention}"
                  </p>
                </div>
              )}

              {entry.gratitudes && entry.gratitudes.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-800">
                    Gratitude Sparks
                  </span>
                  <ul className="space-y-1 text-xs">
                    {entry.gratitudes.map((g, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-500">✨</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Main Journal Content (Markdown) */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
            <div className="prose prose-stone max-w-none text-stone-800 font-serif-display text-base sm:text-lg leading-relaxed space-y-4">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Gemini AI Reflection Box */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-indigo-50/60 border border-amber-200/90 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                    Gemini Socratic Reflection
                  </h3>
                  <p className="text-xs text-stone-700">
                    AI psychological insights and mindful reframing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="detail-open-chat-btn"
                  type="button"
                  onClick={() => setIsCompanionChatOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-900 bg-indigo-100/80 hover:bg-indigo-200/80 border border-indigo-200 transition-colors cursor-pointer"
                  title="Open interactive reflection dialogue"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Discuss with Gemini</span>
                </button>

                <button
                  id="refresh-reflection-btn"
                  type="button"
                  onClick={handleGenerateOrRefreshReflection}
                  disabled={isGeneratingReflection}
                  className="p-1.5 rounded-xl text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer disabled:opacity-40"
                  title="Re-generate reflection"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingReflection ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {reflectionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {reflectionError}
              </div>
            )}

            {entry.aiReflection ? (
              <div className="space-y-4 pt-2">
                {/* Emotional Tone & Summary */}
                <div className="p-4 rounded-2xl bg-white/95 border border-stone-200/90 shadow-2xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                      Holistic Summary
                    </span>
                    {entry.aiReflection.emotionalTone && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                        Emotional Tone: {entry.aiReflection.emotionalTone}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-serif-display leading-relaxed">
                    {entry.aiReflection.summary}
                  </p>
                  {entry.aiReflection.keyThemes && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.aiReflection.keyThemes.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium"
                        >
                          • {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insights & Growth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entry.aiReflection.insights && entry.aiReflection.insights.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white/95 border border-stone-200/90 shadow-2xs space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                        Psychological Insights
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {entry.aiReflection.insights.map((ins, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{ins}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.aiReflection.growthOpportunities && (
                    <div className="p-4 rounded-2xl bg-white/95 border border-stone-200/90 shadow-2xs space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        Growth Opportunities
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {entry.aiReflection.growthOpportunities.map((opp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Socratic Question Quote */}
                {entry.aiReflection.socraticQuestion && (
                  <div className="p-4 rounded-2xl bg-amber-100/60 border border-amber-200 text-stone-900 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-700" />
                      Socratic Contemplation
                    </span>
                    <p className="text-sm font-serif-display italic font-semibold text-amber-950">
                      "{entry.aiReflection.socraticQuestion}"
                    </p>
                  </div>
                )}

                {/* Reframing */}
                {entry.aiReflection.reframing && (
                  <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/90 text-stone-900 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-teal-700" />
                      Compassionate Perspective
                    </span>
                    <p className="text-xs sm:text-sm text-teal-950 leading-relaxed">
                      {entry.aiReflection.reframing}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/60 rounded-2xl border border-dashed border-stone-300">
                <p className="text-xs text-stone-500 mb-3">
                  No reflection generated yet for this entry.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateOrRefreshReflection}
                  disabled={isGeneratingReflection}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 border border-amber-400 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingReflection ? 'Generating...' : 'Analyze with Gemini'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Companion Chat Drawer */}
      <CompanionChatDrawer
        isOpen={isCompanionChatOpen}
        onClose={() => setIsCompanionChatOpen(false)}
        entryTitle={entry.title}
        entryContent={entry.content}
        entryMood={entry.mood}
        chatHistory={entry.aiChatHistory || []}
        onUpdateChatHistory={(history) => {
          onUpdateEntry({ ...entry, aiChatHistory: history });
        }}
      />
    </div>
  );
};
