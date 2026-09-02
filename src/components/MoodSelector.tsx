import React from 'react';
import { MOOD_CONFIGS } from '../data/initialEntries';
import { MoodType } from '../types';

interface MoodSelectorProps {
  selectedMood: MoodType;
  onSelectMood: (mood: MoodType) => void;
  size?: 'sm' | 'md';
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelectMood,
  size = 'md',
}) => {
  const moods = Object.values(MOOD_CONFIGS);

  return (
    <div id="mood-selector-container" className="flex flex-wrap gap-2 items-center">
      {moods.map((m) => {
        const isSelected = selectedMood === m.id;
        return (
          <button
            key={m.id}
            id={`mood-btn-${m.id}`}
            type="button"
            onClick={() => onSelectMood(m.id)}
            title={m.description}
            className={`transition-all duration-200 rounded-full flex items-center gap-1.5 font-medium cursor-pointer ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
            } ${
              isSelected
                ? `${m.badgeBg} ring-2 ring-amber-400 shadow-xs scale-105 font-semibold`
                : 'bg-white/80 hover:bg-stone-100 text-stone-600 border border-stone-200/70 hover:border-stone-300'
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
