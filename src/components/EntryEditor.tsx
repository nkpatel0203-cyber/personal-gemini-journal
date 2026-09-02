import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  ArrowLeft,
  Eye,
  Edit3,
  Mic,
  MicOff,
  Tag,
  MapPin,
  CloudSun,
  Compass,
  MessageSquare,
  Maximize2,
  Minimize2,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Volume2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { JournalEntry, MoodType } from '../types';
import { MoodSelector } from './MoodSelector';
import { CompanionChatDrawer } from './CompanionChatDrawer';
import {
  fetchAIReflection,
  fetchTitleAndTagSuggestions,
} from '../services/geminiService';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
} from '../utils/speechRecognition';

interface EntryEditorProps {
  initialEntry?: JournalEntry | null;
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
  onOpenPromptsModal: () => void;
}

export const EntryEditor: React.FC<EntryEditorProps> = ({
  initialEntry,
  onSave,
  onCancel,
  onOpenPromptsModal,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'reflective');
  const [date, setDate] = useState(
    initialEntry?.date
      ? new Date(initialEntry.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState(initialEntry?.location || '');
  const [weather, setWeather] = useState(initialEntry?.weather || '');
  const [dailyIntention, setDailyIntention] = useState(initialEntry?.dailyIntention || '');
  const [gratitudes, setGratitudes] = useState<string[]>(
    initialEntry?.gratitudes && initialEntry.gratitudes.length > 0
      ? initialEntry.gratitudes
      : ['', '', '']
  );
  const [isFavorite, setIsFavorite] = useState(initialEntry?.isFavorite || false);
  const [aiReflection, setAiReflection] = useState(initialEntry?.aiReflection || undefined);
  const [chatHistory, setChatHistory] = useState(initialEntry?.aiChatHistory || []);

  // UI States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showMetadataDrawer, setShowMetadataDrawer] = useState(
    Boolean(
      initialEntry?.dailyIntention ||
      (initialEntry?.gratitudes && initialEntry.gratitudes.some((g) => g.trim().length > 0)) ||
      initialEntry?.location ||
      initialEntry?.weather
    )
  );
  const [isCompanionChatOpen, setIsCompanionChatOpen] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSuggestingTitleTags, setIsSuggestingTitleTags] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const speechRecognizerRef = useRef<any>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Word & Reading Time stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle Speech Recognition setup
  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognizer = createSpeechRecognizer(
        (result) => {
          if (result.isFinal) {
            setContent((prev) => {
              const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
              return prev + separator + result.transcript;
            });
          }
        },
        (err) => {
          console.error('Speech recognition error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        speechRecognizerRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      setIsListening(false);
    }
  };

  // Tag helpers
  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI Title & Tags Suggestion
  const handleAutoSuggestTitleAndTags = async () => {
    if (!content.trim()) {
      setNotification({
        message: 'Please write a few thoughts first so Gemini can analyze them.',
        type: 'info',
      });
      return;
    }

    setIsSuggestingTitleTags(true);
    try {
      const result = await fetchTitleAndTagSuggestions(content);
      if (result.titles && result.titles.length > 0 && !title.trim()) {
        setTitle(result.titles[0]);
      }
      if (result.tags && result.tags.length > 0) {
        const merged = Array.from(new Set([...tags, ...result.tags.map((t) => t.toLowerCase())]));
        setTags(merged);
      }
      if (result.suggestedMood && !initialEntry) {
        setMood(result.suggestedMood as MoodType);
      }
      setNotification({
        message: '✨ Suggested title and meaningful tags generated!',
        type: 'success',
      });
    } catch (e: any) {
      console.error('Suggestion error:', e);
      setNotification({
        message: e?.message || 'Could not fetch suggestions right now.',
        type: 'info',
      });
    } finally {
      setIsSuggestingTitleTags(false);
    }
  };

  // AI Deep Reflection Trigger
  const handleGenerateReflection = async () => {
    if (!content.trim()) {
      setNotification({
        message: 'Please write your entry before requesting a deep reflection.',
        type: 'info',
      });
      return;
    }

    setIsReflecting(true);
    setReflectionError(null);

    try {
      const validGratitudes = gratitudes.filter((g) => g.trim().length > 0);
      const reflection = await fetchAIReflection({
        title: title || 'Untitled Reflection',
        content,
        mood,
        dailyIntention,
        gratitudes: validGratitudes,
      });

      setAiReflection(reflection);
      setNotification({
        message: '✨ Deep Gemini reflection generated with insights & contemplation questions.',
        type: 'success',
      });

      // Subtle celebration confetti
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#fbbf24', '#6366f1', '#10b981'],
        });
      } catch {}
    } catch (err: any) {
      console.error('Reflection error:', err);
      setReflectionError(err?.message || 'Failed to generate reflection. Check your network or API status.');
    } finally {
      setIsReflecting(false);
    }
  };

  // Save handler
  const handleSave = () => {
    if (!content.trim() && !title.trim()) {
      setNotification({
        message: 'Please write something in your journal entry before saving.',
        type: 'info',
      });
      return;
    }

    const validGratitudes = gratitudes.filter((g) => g.trim().length > 0);

    const savedEntry: JournalEntry = {
      id: initialEntry?.id || 'entry_' + Date.now(),
      title: title.trim() || 'Untitled Reflection',
      content: content.trim(),
      date: new Date(date).toISOString(),
      updatedAt: new Date().toISOString(),
      mood,
      tags,
      location: location.trim() || undefined,
      weather: weather.trim() || undefined,
      dailyIntention: dailyIntention.trim() || undefined,
      gratitudes: validGratitudes.length > 0 ? validGratitudes : undefined,
      isFavorite,
      aiReflection,
      aiChatHistory: chatHistory.length > 0 ? chatHistory : undefined,
    };

    onSave(savedEntry);
  };

  return (
    <div
      id="entry-editor-wrapper"
      className={`min-h-screen bg-[#faf8f5] transition-all duration-300 ${
        isFocusMode ? 'p-3 sm:p-6 bg-[#fcfbf9]' : 'pb-16'
      }`}
    >
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            id="editor-back-btn"
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="Return to entries"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900/80">
              {initialEntry ? 'Editing Entry' : 'New Journal Entry'}
            </span>
            <div className="text-[11px] text-stone-500 font-mono-code flex items-center gap-2">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>~{readTimeMin} min read</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prompts Drawer Button */}
          <button
            id="editor-prompts-btn"
            type="button"
            onClick={onOpenPromptsModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
            title="Need inspiration? Browse mindful prompts"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Prompt Ideas</span>
          </button>

          {/* Socratic Chat Companion Toggle */}
          <button
            id="editor-open-chat-btn"
            type="button"
            onClick={() => setIsCompanionChatOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
            title="Chat with Gemini Socratic Companion"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Reflective Chat</span>
            {chatHistory.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>

          {/* Preview / Edit Toggle */}
          <button
            id="editor-preview-toggle-btn"
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="p-2 rounded-xl text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
            title={isPreviewMode ? 'Switch to Edit' : 'Preview Markdown'}
          >
            {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Focus Mode Toggle */}
          <button
            id="editor-focus-toggle-btn"
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="p-2 rounded-xl text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
            title={isFocusMode ? 'Exit Focus Mode' : 'Enter Distraction-Free Mode'}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Save Button */}
          <button
            id="editor-save-btn"
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Entry</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div className="max-w-4xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className={`max-w-4xl mx-auto px-4 sm:px-8 pt-6 space-y-6 ${isFocusMode ? 'pt-8' : ''}`}>
        {/* Mood and Date selection row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Emotional State / Mood
            </label>
            <MoodSelector selectedMood={mood} onSelectMood={setMood} size="sm" />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                Date & Time
              </label>
              <input
                id="entry-datetime-input"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono-code"
              />
            </div>
          </div>
        </div>

        {/* Title input with AI suggestion trigger */}
        <div className="relative">
          <input
            id="entry-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A title or poignant phrase for today..."
            className="w-full text-2xl sm:text-3xl font-editorial font-bold text-stone-900 placeholder-stone-400/80 bg-transparent border-b border-stone-200 focus:border-amber-400 focus:outline-none py-2 px-1 transition-colors"
          />

          <button
            id="suggest-title-tags-btn"
            type="button"
            onClick={handleAutoSuggestTitleAndTags}
            disabled={isSuggestingTitleTags || !content.trim()}
            className="absolute right-2 top-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Auto-suggest an elegant title and tags from your text"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isSuggestingTitleTags ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">AI Title & Tags</span>
          </button>
        </div>

        {/* Metadata Toggle (Gratitude, Intention, Weather, Location) */}
        <div>
          <button
            id="toggle-metadata-btn"
            type="button"
            onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>{showMetadataDrawer ? '▾ Hide' : '▸ Expand'} Mindfulness Details (Intention, Gratitude, Setting)</span>
          </button>

          {showMetadataDrawer && (
            <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4 animate-in fade-in duration-200">
              {/* Daily Intention */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Daily Intention / Anchor
                </label>
                <input
                  id="entry-intention-input"
                  type="text"
                  value={dailyIntention}
                  onChange={(e) => setDailyIntention(e.target.value)}
                  placeholder="e.g. Speak with gentleness, pause before reacting..."
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* 3 Gratitudes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Three Small Moments of Gratitude
                </label>
                <div className="space-y-2">
                  {gratitudes.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-semibold text-amber-700">
                        {idx + 1}.
                      </span>
                      <input
                        id={`entry-gratitude-input-${idx}`}
                        type="text"
                        value={g}
                        onChange={(e) => {
                          const updated = [...gratitudes];
                          updated[idx] = e.target.value;
                          setGratitudes(updated);
                        }}
                        placeholder={`Gratitude spark #${idx + 1}...`}
                        className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Location & Weather */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2 bg-stone-50/70 p-2 rounded-xl border border-stone-200">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    id="entry-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location / Setting (e.g. Quiet library)"
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400"
                  />
                </div>

                <div className="flex items-center gap-2 bg-stone-50/70 p-2 rounded-xl border border-stone-200">
                  <CloudSun className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    id="entry-weather-input"
                    type="text"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder="Weather / Ambiance (e.g. Golden sunset, 20°C)"
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="relative rounded-2xl bg-white border border-stone-200/90 shadow-xs p-4 sm:p-6 transition-all">
          {/* Writing Toolbar Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">Reflective Canvas</span>
              <span className="text-stone-300">|</span>
              {isListening ? (
                <span className="inline-flex items-center gap-1 text-rose-600 font-semibold animate-pulse">
                  <Mic className="w-3.5 h-3.5" /> Listening to your voice...
                </span>
              ) : (
                <span>Markdown supported</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Dictation Button */}
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
                title="Speak your thoughts aloud with live speech-to-text"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-stone-600" />}
                <span>{isListening ? 'Stop Voice' : 'Voice Dictate'}</span>
              </button>
            </div>
          </div>

          {/* Editor vs Preview Mode */}
          {isPreviewMode ? (
            <div
              id="entry-markdown-preview"
              className="min-h-[340px] prose prose-stone max-w-none text-stone-800 leading-relaxed font-serif-display text-base sm:text-lg"
            >
              {content.trim() ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p className="text-stone-400 italic">No content written yet...</p>
              )}
            </div>
          ) : (
            <textarea
              ref={contentTextareaRef}
              id="entry-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What is present for you in this moment? Pour out your thoughts, uncensored and free..."
              rows={14}
              className="w-full resize-y bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400 leading-relaxed font-serif-display text-base sm:text-lg tracking-normal"
            />
          )}

          {/* Tag Pills section inside canvas footer */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                id="add-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                className="text-xs px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-400 w-24"
              />
              <button
                id="add-tag-btn"
                type="button"
                onClick={handleAddTag}
                className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Gemini AI Deep Reflection Toolbar & Output Card */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50/70 via-stone-50 to-indigo-50/50 border border-amber-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  Gemini Deep Reflection & Insights
                </h3>
                <p className="text-xs text-stone-700">
                  Synthesizes emotional undercurrents, psychological takeaways, and constructive reframing
                </p>
              </div>
            </div>

            <button
              id="generate-deep-reflection-btn"
              type="button"
              onClick={handleGenerateReflection}
              disabled={isReflecting || !content.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 border border-amber-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isReflecting ? 'animate-spin' : ''}`} />
              <span>{isReflecting ? 'Reflecting with Gemini...' : 'Generate Reflection'}</span>
            </button>
          </div>

          {reflectionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{reflectionError}</span>
            </div>
          )}

          {/* Render Active AI Reflection */}
          {aiReflection && (
            <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-4 animate-in fade-in duration-300">
              {/* Summary & Emotional Tone */}
              <div className="p-4 rounded-xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Reflection Summary
                  </span>
                  {aiReflection.emotionalTone && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                      Tone: {aiReflection.emotionalTone}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-serif-display">
                  {aiReflection.summary}
                </p>
                {aiReflection.keyThemes && aiReflection.keyThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiReflection.keyThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200"
                      >
                        • {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Insights & Growth opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiReflection.insights && aiReflection.insights.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      💡 Deep Insights
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {aiReflection.insights.map((ins, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReflection.growthOpportunities && aiReflection.growthOpportunities.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                      🌱 Growth & Micro-Habits
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {aiReflection.growthOpportunities.map((opp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Socratic Question & Reframing */}
              <div className="space-y-3">
                {aiReflection.socraticQuestion && (
                  <div className="p-4 rounded-xl bg-amber-100/50 border border-amber-200 text-stone-800 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                      Socratic Contemplation Question
                    </span>
                    <p className="text-xs sm:text-sm italic font-serif-display text-amber-950 font-medium">
                      "{aiReflection.socraticQuestion}"
                    </p>
                  </div>
                )}

                {aiReflection.reframing && (
                  <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-stone-800 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
                      Compassionate Perspective Reframing
                    </span>
                    <p className="text-xs sm:text-sm text-teal-950 leading-relaxed">
                      {aiReflection.reframing}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Socratic Companion Drawer */}
      <CompanionChatDrawer
        isOpen={isCompanionChatOpen}
        onClose={() => setIsCompanionChatOpen(false)}
        entryTitle={title}
        entryContent={content}
        entryMood={mood}
        chatHistory={chatHistory}
        onUpdateChatHistory={setChatHistory}
        onAppendToEntry={(text) => {
          setContent((prev) => prev + text);
          setNotification({
            message: 'Appended Gemini revelation into your entry text.',
            type: 'success',
          });
        }}
      />
    </div>
  );
};
