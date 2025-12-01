'use client';

import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';

interface EmotionalStateInputProps {
  value?: string | string[] | { [key: string]: boolean };
  onChange: (emotions: string[] | { [key: string]: boolean }) => void;
  placeholder?: string;
  className?: string;
}

interface EmotionOption {
  key: string;
  label: string;
  color: string;
}

const EMOTION_OPTIONS: EmotionOption[] = [
  {
    key: 'FOMO',
    label: 'FOMO',
    color: 'yellow'
  },
  {
    key: 'REVENGE',
    label: 'Revenge',
    color: 'red'
  },
  {
    key: 'TILT',
    label: 'Tilt',
    color: 'orange'
  },
  {
    key: 'OVERRISK',
    label: 'Over Risk',
    color: 'red'
  },
  {
    key: 'PATIENCE',
    label: 'Patience',
    color: 'green'
  },
  {
    key: 'REGRET',
    label: 'Regret',
    color: 'blue'
  },
  {
    key: 'DISCIPLINE',
    label: 'Discipline',
    color: 'green'
  },
  {
    key: 'CONFIDENT',
    label: 'Confident',
    color: 'blue'
  },
  {
    key: 'ANXIOUS',
    label: 'Anxious',
    color: 'purple'
  },
  {
    key: 'NEUTRAL',
    label: 'Neutral',
    color: 'gray'
  }
];

const COLOR_CLASSES = {
  yellow: 'bg-[var(--warm-sand)]/10 border-[var(--warm-sand)]/20 hover:bg-[var(--warm-sand)]/20', // Warm Sand for FOMO
  red: 'bg-[var(--rust-red)]/10 border-[var(--rust-red)]/20 hover:bg-[var(--rust-red)]/20 text-[var(--rust-red)]', // Rust Red for REVENGE/OVERRISK
  orange: 'bg-[var(--dusty-gold)]/10 border-[var(--dusty-gold)]/20 hover:bg-[var(--dusty-gold)]/20 text-[var(--dusty-gold)]', // Dusty Gold for TILT
  green: 'bg-[var(--muted-olive)]/10 border-[var(--muted-olive)]/20 hover:bg-[var(--muted-olive)]/20 text-[var(--muted-olive)]', // Muted Olive for PATIENCE/DISCIPLINE
  blue: 'bg-[var(--warm-sand)]/10 border-[var(--warm-sand)]/20 hover:bg-[var(--warm-sand)]/20 text-[var(--warm-sand)]', // Warm Sand for REGRET/CONFIDENT
  purple: 'bg-[var(--dusty-gold)]/10 border-[var(--dusty-gold)]/20 hover:bg-[var(--dusty-gold)]/20 text-[var(--dusty-gold)]', // Dusty Gold for ANXIOUS
  gray: 'bg-[var(--muted-olive)]/10 border-[var(--muted-olive)]/20 hover:bg-[var(--muted-olive)]/20 text-[var(--muted-olive)]' // Muted Olive for NEUTRAL
};

export default function EmotionalStateInput({
  value,
  onChange,
  placeholder = "Select emotions...",
  className = ""
}: EmotionalStateInputProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set());

  // Initialize selected emotions from value prop
  useEffect(() => {
    if (value) {
      const emotions = new Set<string>();
      
      if (Array.isArray(value)) {
        value.forEach((emotion: string) => emotions.add(emotion));
      } else if (typeof value === 'string') {
        // Handle comma-separated string
        value.split(',').forEach(emotion => {
          const trimmed = emotion.trim();
          if (trimmed) emotions.add(trimmed);
        });
      } else if (typeof value === 'object' && value !== null) {
        // Handle object with boolean values (like { FOMO: true, PATIENCE: false })
        Object.entries(value).forEach(([key, isSelected]) => {
          if (isSelected) emotions.add(key);
        });
      }
      
      setSelectedEmotions(emotions);
    } else {
      setSelectedEmotions(new Set());
    }
  }, [value]);

  const handleEmotionToggle = (emotionKey: string) => {
    const newEmotions = new Set(selectedEmotions);
    
    if (newEmotions.has(emotionKey)) {
      newEmotions.delete(emotionKey);
    } else {
      newEmotions.add(emotionKey);
    }
    
    setSelectedEmotions(newEmotions);
    onChange(Array.from(newEmotions));
  };

  const handleRemoveEmotion = (emotionKey: string) => {
    const newEmotions = new Set(selectedEmotions);
    newEmotions.delete(emotionKey);
    setSelectedEmotions(newEmotions);
    onChange(Array.from(newEmotions));
  };

  const getEmotionDisplay = (emotionKey: string) => {
    const option = EMOTION_OPTIONS.find(opt => opt.key === emotionKey);
    return option || {
      key: emotionKey,
      label: emotionKey,
      color: 'gray'
    };
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected Emotions Display */}
      {selectedEmotions.size > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from(selectedEmotions).map(emotionKey => {
            const emotion = getEmotionDisplay(emotionKey);
            return (
              <div
                key={emotionKey}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border whitespace-nowrap ${COLOR_CLASSES[emotion.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.gray}`}
                style={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <span className="text-sm font-medium">{emotion.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmotion(emotionKey)}
                  className="ml-1 hover:opacity-70 flex-shrink-0"
                  style={{ color: 'var(--rust-red)' }}
                >
                  <XCircle className="w-3 h-3 icon-warning" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Emotion Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EMOTION_OPTIONS.map(emotion => (
          <button
            key={emotion.key}
            type="button"
            onClick={() => handleEmotionToggle(emotion.key)}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all whitespace-nowrap ${
              selectedEmotions.has(emotion.key)
                ? COLOR_CLASSES[emotion.color as keyof typeof COLOR_CLASSES]
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            style={{
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <span className="text-sm font-medium" style={{ fontSize: '14px', fontWeight: '500' }}>{emotion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}