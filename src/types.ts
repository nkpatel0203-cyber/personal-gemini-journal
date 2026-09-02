export type MoodType =
  | 'serene'
  | 'grateful'
  | 'energized'
  | 'reflective'
  | 'creative'
  | 'overwhelmed'
  | 'melancholic'
  | 'hopeful'
  | 'grounded';

export interface AIReflection {
  summary?: string;
  insights?: string[];
  growthOpportunities?: string[];
  socraticQuestion?: string;
  reframing?: string;
  keyThemes?: string[];
  emotionalTone?: string;
  generatedAt: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string; // ISO date string
  updatedAt: string;
  mood: MoodType;
  tags: string[];
  location?: string;
  weather?: string;
  gratitudes?: string[];
  dailyIntention?: string;
  isFavorite: boolean;
  aiReflection?: AIReflection;
  aiChatHistory?: AIChatMessage[];
}

export interface MoodConfig {
  id: MoodType;
  label: string;
  emoji: string;
  badgeBg: string;
  textColor: string;
  dotColor: string;
  description: string;
}

export interface JournalFilterState {
  search: string;
  mood: string;
  tag: string;
  favoritesOnly: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month';
  sort: 'newest' | 'oldest';
}

export interface AIPromptRequest {
  mood?: string;
  category?: 'reflection' | 'gratitude' | 'growth' | 'evening' | 'morning' | 'creativity' | 'shadow_work';
  recentContext?: string;
}

export interface AIWeeklySynthesis {
  timeframe: string;
  dominantThemes: string[];
  emotionalArc: string;
  growthCelebrations: string[];
  compassionateNudge: string;
  affirmation: string;
  generatedAt: string;
}
