import React, { useState } from 'react';
import { Sparkles, Compass, X, ArrowRight, RefreshCw, Sun, Moon, Heart, Target, Lightbulb, ShieldAlert } from 'lucide-react';
import { fetchAIPrompts, PromptSuggestion } from '../services/geminiService';
import { MoodType } from '../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string, suggestedMood?: MoodType) => void;
}

interface StaticCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  prompts: { prompt: string; context: string; tag: string }[];
}

const STATIC_CATEGORIES: StaticCategory[] = [
  {
    id: 'morning',
    name: 'Morning Intention',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
    prompts: [
      {
        prompt: 'What is one quality of being (e.g. patience, boldness, ease) I want to embody today regardless of circumstances?',
        context: 'Anchors your identity before the rush of daily demands.',
        tag: 'Anchor',
      },
      {
        prompt: 'If today were a single canvas, what is the most meaningful brushstroke I can make?',
        context: 'Clarifies high-leverage focus vs busywork.',
        tag: 'Clarity',
      },
      {
        prompt: 'What physical sensation am I waking up with, and what is my body asking for today?',
        context: 'Somatic grounding and self-care alignment.',
        tag: 'Somatic',
      },
    ],
  },
  {
    id: 'evening',
    name: 'Evening Unwind',
    icon: <Moon className="w-4 h-4 text-indigo-500" />,
    prompts: [
      {
        prompt: 'What is one tension or unfinished thought from today that I am choosing to release before sleep?',
        context: 'Cleanses mental bandwidth for restorative sleep.',
        tag: 'Release',
      },
      {
        prompt: 'Where did I surprise myself with kindness, patience, or resilience today?',
        context: 'Reinforces positive self-efficacy over inner criticism.',
        tag: 'Gratitude',
      },
      {
        prompt: 'What was a moment today when time slowed down and I felt truly present?',
        context: 'Savoring micro-moments of peace.',
        tag: 'Presence',
      },
    ],
  },
  {
    id: 'shadow_work',
    name: 'Emotional Clarity',
    icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
    prompts: [
      {
        prompt: 'What uncomfortable emotion has been knocking on my door lately, and what is it trying to protect?',
        context: 'Approaching difficult feelings with curiosity rather than shame.',
        tag: 'Shadow Work',
      },
      {
        prompt: 'Where am I saying "yes" when my inner compass is whispering a definitive "no"?',
        context: 'Boundary inspection and integrity alignment.',
        tag: 'Boundaries',
      },
      {
        prompt: 'What standard am I holding myself to that I would never demand from a dear friend?',
        context: 'Exposing unfair internal perfectionism.',
        tag: 'Self-Compassion',
      },
    ],
  },
  {
    id: 'growth',
    name: 'Growth & Purpose',
    icon: <Target className="w-4 h-4 text-emerald-500" />,
    prompts: [
      {
        prompt: 'What risk would I take if I knew that stumbling would only make me wiser, not lesser?',
        context: 'Unshackling creative and professional courage.',
        tag: 'Courage',
      },
      {
        prompt: 'Looking back at who I was 12 months ago, what struggle have I outgrown without noticing?',
        context: 'Recognizing invisible personal evolution.',
        tag: 'Perspective',
      },
    ],
  },
  {
    id: 'creative',
    name: 'Creative Sparks',
    icon: <Lightbulb className="w-4 h-4 text-purple-500" />,
    prompts: [
      {
        prompt: 'Describe a mundane object in your room as if it were a magical artifact from an ancient civilization.',
        context: 'Playful lateral thinking and sensory expansion.',
        tag: 'Imagination',
      },
      {
        prompt: 'Write a letter to your future self on a sunny Tuesday five years from today.',
        context: 'Envisioning vibrant possibilities without limitation.',
        tag: 'Vision',
      },
    ],
  },
];

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('morning');
  const [customMood, setCustomMood] = useState<string>('');
  const [aiPrompts, setAiPrompts] = useState<PromptSuggestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategoryObj = STATIC_CATEGORIES.find((c) => c.id === activeCategory);

  const handleGenerateCustomAIPrompts = async () => {
    setIsLoadingAI(true);
    setError(null);
    try {
      const prompts = await fetchAIPrompts({
        category: activeCategory as any,
        mood: customMood || undefined,
      });
      setAiPrompts(prompts);
    } catch (e: any) {
      console.error('Prompt generation failed:', e);
      setError(e?.message || 'Failed to generate prompts');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div
      id="prompts-modal-overlay"
      className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="prompts-modal-container"
        className="bg-[#faf8f5] w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-stone-900">
                Mindful Journal Prompts
              </h3>
              <p className="text-xs text-stone-500">
                Thoughtfully crafted entry hooks & dynamic Gemini prompts
              </p>
            </div>
          </div>
          <button
            id="close-prompts-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-4 pb-2 border-b border-stone-200 flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATIC_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setAiPrompts([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-400 text-amber-950 shadow-2xs'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* AI Customization Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <input
              id="ai-prompt-mood-input"
              type="text"
              value={customMood}
              onChange={(e) => setCustomMood(e.target.value)}
              placeholder="Filter by custom feeling (e.g. restless, nostalgic, grateful)..."
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <button
            id="generate-ai-prompts-btn"
            type="button"
            onClick={handleGenerateCustomAIPrompts}
            disabled={isLoadingAI}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 border border-amber-400/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
            <span>{isLoadingAI ? 'Generating...' : 'Ask Gemini for Fresh Prompts'}</span>
          </button>
        </div>

        {/* Prompt List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* AI generated list if available */}
          {aiPrompts.length > 0 ? (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Gemini Personalized Prompts
              </span>
              {aiPrompts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-amber-200/90 hover:border-amber-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {p.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrompt(p.prompt);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
                    >
                      <span>Start with this</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-serif-display font-medium text-stone-900 leading-snug">
                    "{p.prompt}"
                  </p>
                  <p className="text-xs text-stone-500 italic">
                    {p.context}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* Static Curated Prompts */
            <div className="space-y-3">
              {currentCategoryObj?.prompts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {p.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrompt(p.prompt);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
                    >
                      <span>Start with this</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-serif-display font-medium text-stone-900 leading-snug">
                    "{p.prompt}"
                  </p>
                  <p className="text-xs text-stone-500 italic">
                    {p.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
