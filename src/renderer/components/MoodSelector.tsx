import React from 'react';
import type { Mood } from '../../shared/types';

const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: 'radiant', emoji: '✨', label: 'Radiant' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'stormy', emoji: '🌧️', label: 'Stormy' },
];

export const moodEmoji: Record<Mood, string> = {
  radiant: '✨',
  good: '😊',
  neutral: '😐',
  low: '😔',
  stormy: '🌧️',
};

interface MoodSelectorProps {
  value: Mood;
  onChange: (mood: Mood) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="mood-selector">
      <span className="mood-label">Mood</span>
      {moods.map((mood) => (
        <button
          key={mood.value}
          type="button"
          className={`mood-btn${value === mood.value ? ' active' : ''}`}
          onClick={() => onChange(mood.value)}
          title={mood.label}
        >
          <span>{mood.emoji}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;
