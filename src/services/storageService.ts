import { INITIAL_JOURNAL_ENTRIES } from '../data/initialEntries';
import { JournalEntry } from '../types';

const STORAGE_KEY = 'gemini_personal_journal_entries_v1';
const SETTINGS_KEY = 'gemini_journal_settings_v1';

export function getStoredEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial entries
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_JOURNAL_ENTRIES));
      return INITIAL_JOURNAL_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_JOURNAL_ENTRIES;
  } catch (e) {
    console.error('Failed to read journal entries from localStorage', e);
    return INITIAL_JOURNAL_ENTRIES;
  }
}

export function saveEntries(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save journal entries', e);
  }
}

export function saveSingleEntry(entry: JournalEntry): JournalEntry[] {
  const current = getStoredEntries();
  const index = current.findIndex((e) => e.id === entry.id);
  let updated: JournalEntry[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...entry, updatedAt: new Date().toISOString() }, ...current];
  }

  saveEntries(updated);
  return updated;
}

export function deleteEntryById(id: string): JournalEntry[] {
  const current = getStoredEntries();
  const updated = current.filter((e) => e.id !== id);
  saveEntries(updated);
  return updated;
}

export function toggleFavoriteById(id: string): JournalEntry[] {
  const current = getStoredEntries();
  const updated = current.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e));
  saveEntries(updated);
  return updated;
}

export function calculateJournalStreak(entries: JournalEntry[]): number {
  if (!entries || entries.length === 0) return 0;

  const dates = Array.from(
    new Set(
      entries
        .map((e) => {
          try {
            return new Date(e.date).toISOString().slice(0, 10);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) return 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Check if today or yesterday has an entry
  let startIndex = 0;
  if (dates[0] === todayStr) {
    startIndex = 0;
  } else if (dates[0] === yesterday) {
    startIndex = 0;
  } else {
    return 0; // Streak broken
  }

  let streak = 0;
  let cursor = new Date(dates[startIndex]);

  for (let i = startIndex; i < dates.length; i++) {
    const entryDate = new Date(dates[i]);
    const diffDays = Math.round(
      (cursor.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (i === startIndex || diffDays === 1) {
      streak++;
      cursor = entryDate;
    } else if (diffDays === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export function exportEntriesAsJson(entries: JournalEntry[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `gemini_journal_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportEntriesAsMarkdown(entries: JournalEntry[]): void {
  let md = `# Personal Gemini Journal Archive\n*Exported on ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}*\n\n---\n\n`;

  for (const entry of entries) {
    md += `## ${entry.title || 'Untitled'}\n\n`;
    md += `**Date:** ${new Date(entry.date).toLocaleString()}  \n`;
    md += `**Mood:** ${entry.mood}  \n`;
    if (entry.location) md += `**Location:** ${entry.location}  \n`;
    if (entry.weather) md += `**Weather:** ${entry.weather}  \n`;
    if (entry.dailyIntention) md += `**Daily Intention:** ${entry.dailyIntention}  \n`;
    if (entry.tags && entry.tags.length > 0) md += `**Tags:** ${entry.tags.join(', ')}  \n`;
    if (entry.gratitudes && entry.gratitudes.length > 0) {
      md += `\n**Gratitude List:**\n`;
      entry.gratitudes.forEach((g) => {
        md += `- ${g}\n`;
      });
    }
    md += `\n### Entry\n\n${entry.content}\n\n`;

    if (entry.aiReflection) {
      md += `\n> **Gemini Reflection Summary:**  \n> ${entry.aiReflection.summary || ''}\n>\n`;
      if (entry.aiReflection.insights?.length) {
        md += `> **Insights:**  \n`;
        entry.aiReflection.insights.forEach((ins) => {
          md += `> - ${ins}\n`;
        });
      }
      if (entry.aiReflection.socraticQuestion) {
        md += `>\n> **Socratic Contemplation:** *${entry.aiReflection.socraticQuestion}*\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gemini_journal_${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
