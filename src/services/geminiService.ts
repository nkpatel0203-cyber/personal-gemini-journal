import { AIChatMessage, AIReflection, AIWeeklySynthesis, JournalEntry } from '../types';

export interface PromptSuggestion {
  prompt: string;
  context: string;
  tag: string;
}

export interface TitleTagSuggestion {
  titles: string[];
  tags: string[];
  suggestedMood: string;
}

export async function fetchAIReflection(entry: Partial<JournalEntry>): Promise<AIReflection> {
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      gratitudes: entry.gratitudes,
      dailyIntention: entry.dailyIntention,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.reflection;
}

export async function fetchAIPrompts(params: {
  mood?: string;
  category?: string;
  recentContext?: string;
}): Promise<PromptSuggestion[]> {
  const response = await fetch('/api/gemini/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch prompts');
  }

  const data = await response.json();
  return data.prompts || [];
}

export async function sendAIChatMessage(
  messages: AIChatMessage[],
  entryContext: { title?: string; content?: string; mood?: string }
): Promise<AIChatMessage> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      entryContext,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to communicate with reflection companion');
  }

  const data = await response.json();
  return data.message;
}

export async function fetchPeriodicSynthesis(
  entries: JournalEntry[],
  timeframe: string
): Promise<AIWeeklySynthesis> {
  const response = await fetch('/api/gemini/synthesis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entries,
      timeframe,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate period synthesis');
  }

  const data = await response.json();
  return data.synthesis;
}

export async function fetchTitleAndTagSuggestions(content: string): Promise<TitleTagSuggestion> {
  const response = await fetch('/api/gemini/suggest-title-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate title and tag suggestions');
  }

  const data = await response.json();
  return {
    titles: data.titles || [],
    tags: data.tags || [],
    suggestedMood: data.suggestedMood || 'reflective',
  };
}
