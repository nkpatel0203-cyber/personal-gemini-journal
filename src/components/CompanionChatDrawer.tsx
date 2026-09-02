import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ArrowDownToLine,
  HelpCircle,
  Heart,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AIChatMessage, MoodType } from '../types';
import { sendAIChatMessage } from '../services/geminiService';

interface CompanionChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entryTitle: string;
  entryContent: string;
  entryMood: MoodType;
  chatHistory: AIChatMessage[];
  onUpdateChatHistory: (messages: AIChatMessage[]) => void;
  onAppendToEntry?: (text: string) => void;
}

const QUICK_PROMPTS = [
  'Help me reframe this feeling with compassion',
  'What deeper question should I ask myself about this?',
  'What patterns or cognitive biases might be at play here?',
  'Give me 1 gentle micro-step for today',
];

export const CompanionChatDrawer: React.FC<CompanionChatDrawerProps> = ({
  isOpen,
  onClose,
  entryTitle,
  entryContent,
  entryMood,
  chatHistory,
  onUpdateChatHistory,
  onAppendToEntry,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userMessage: AIChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updated = [...chatHistory, userMessage];
    onUpdateChatHistory(updated);
    setInput('');
    setIsLoading(true);

    try {
      const assistantMessage = await sendAIChatMessage(updated, {
        title: entryTitle,
        content: entryContent,
        mood: entryMood,
      });
      onUpdateChatHistory([...updated, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to get response from Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      id="companion-chat-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-stone-900/30 backdrop-blur-xs transition-opacity duration-300"
    >
      <div
        id="companion-chat-drawer"
        className="w-full max-w-lg bg-[#faf8f5] h-full shadow-2xl flex flex-col border-l border-stone-200/90 animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                Gemini Socratic Mirror
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-[240px]">
                Reflecting on: {entryTitle || 'Current Entry'}
              </p>
            </div>
          </div>
          <button
            id="close-companion-chat-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Context Banner */}
        <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100/80 text-[12px] text-indigo-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Heart className="w-3.5 h-3.5 text-indigo-600" />
            Empathetic, judgment-free sounding board
          </span>
          <span className="text-[11px] text-indigo-700 uppercase tracking-wider font-semibold">
            {entryMood}
          </span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="font-editorial text-lg text-stone-800">
                  Talk through your thoughts
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                  Gemini reads your current draft to ask gentle, clarifying questions and help you untangle subtle emotions.
                </p>
              </div>

              <div className="pt-2 space-y-2 text-left">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Suggested starters:
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="text-left text-xs p-2.5 rounded-xl bg-white border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-stone-700 transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-amber-400 text-amber-950 font-medium rounded-tr-none'
                        : 'bg-white text-stone-800 border border-stone-200/90 shadow-2xs rounded-tl-none'
                    }`}
                  >
                    <div className="prose prose-stone prose-xs max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {!isUser && onAppendToEntry && (
                      <div className="mt-2 pt-2 border-t border-stone-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onAppendToEntry(`\n\n> **Gemini Reflection:**\n> ${msg.content.replace(/\n/g, '\n> ')}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          title="Append this insight directly into your journal text"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          Insert to entry
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-2.5 justify-start items-center">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-stone-200 text-xs text-stone-500 italic">
                Gemini is reflecting on your words...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts on bottom if conversation started */}
        {chatHistory.length > 0 && (
          <div className="px-4 py-1.5 bg-stone-100/70 border-t border-stone-200 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.slice(0, 2).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              id="companion-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a reflective question or share how you feel..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-stone-200 p-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              id="companion-chat-send-btn"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-stone-400 mt-1 text-center">
            Shift + Enter for new line. Gemini is an AI mindfulness companion, not a clinical therapy service.
          </p>
        </div>
      </div>
    </div>
  );
};
