import React from 'react';
import {
  Star,
  Sparkles,
  Calendar,
  Tag,
  MapPin,
  Trash2,
  Edit,
  ArrowRight,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { MOOD_CONFIGS } from '../data/initialEntries';

interface EntryCardProps {
  entry: JournalEntry;
  onSelect: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const moodConfig = MOOD_CONFIGS[entry.mood] || MOOD_CONFIGS.reflective;

  // Format date
  const entryDate = new Date(entry.date);
  const formattedDate = entryDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = entryDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Plain text preview from markdown
  const snippet = entry.content
    .replace(/[#*`_>~]/g, '')
    .slice(0, 160)
    .trim();

  return (
    <article
      id={`entry-card-${entry.id}`}
      className="group relative rounded-2xl bg-white border border-stone-200/90 hover:border-amber-300 p-5 sm:p-6 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
    >
      {/* Top Meta Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Mood Badge & Date */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${moodConfig.badgeBg}`}
            >
              <span>{moodConfig.emoji}</span>
              <span>{moodConfig.label}</span>
            </span>

            <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{formattedDate}</span>
              <span className="text-stone-300">•</span>
              <span>{formattedTime}</span>
            </span>
          </div>

          {/* Favorite & Quick Options */}
          <div className="flex items-center gap-1">
            <button
              id={`fav-btn-${entry.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(entry.id);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                entry.isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                  : 'text-stone-300 hover:text-stone-600 hover:bg-stone-100'
              }`}
              title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(entry)}
          className="font-editorial text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors cursor-pointer leading-snug"
        >
          {entry.title || 'Untitled Reflection'}
        </h3>

        {/* Snippet Preview */}
        <p
          onClick={() => onSelect(entry)}
          className="text-xs sm:text-sm text-stone-600 font-serif-display leading-relaxed line-clamp-3 cursor-pointer"
        >
          {snippet || '(Empty entry)'}...
        </p>

        {/* Gratitude or Intention teaser */}
        {entry.dailyIntention && (
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-[11px] text-stone-700 flex items-center gap-2">
            <span className="font-semibold text-amber-800 shrink-0">Intention:</span>
            <span className="truncate italic">"{entry.dailyIntention}"</span>
          </div>
        )}

        {/* Tags and Location Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {entry.location && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-600">
              <MapPin className="w-3 h-3 text-stone-400" />
              <span className="truncate max-w-[120px]">{entry.location}</span>
            </span>
          )}

          {entry.tags &&
            entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60"
              >
                #{tag}
              </span>
            ))}
          {entry.tags && entry.tags.length > 3 && (
            <span className="text-[11px] text-stone-400 font-medium">
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer / AI Reflection Status & Action Buttons */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {entry.aiReflection ? (
            <span
              onClick={() => onSelect(entry)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
              title="Click to view Gemini reflection & psychological insights"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Gemini Reflection</span>
            </span>
          ) : (
            <span className="text-[11px] text-stone-400">Unreflected</span>
          )}

          {entry.aiChatHistory && entry.aiChatHistory.length > 0 && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600"
              title={`${entry.aiChatHistory.length} companion chat messages`}
            >
              <MessageSquare className="w-2.5 h-2.5 text-stone-500" />
              <span>{entry.aiChatHistory.length}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`edit-btn-${entry.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(entry);
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Edit entry"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            id={`delete-btn-${entry.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you wish to delete this journal entry?')) {
                onDelete(entry.id);
              }
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            id={`read-btn-${entry.id}`}
            type="button"
            onClick={() => onSelect(entry)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <span>Read</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </article>
  );
};
