'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

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
  yellow: 'bg-[#D6C7B2]/10 border-[#D6C7B2]/20 text-[#D6C7B2]', // Warm Sand for FOMO
  red: 'bg-[#A7352D]/10 border-[#A7352D]/20 text-[#A7352D]', // Rust Red for REVENGE/OVERRISK
  orange: 'bg-[#B89B5E]/10 border-[#B89B5E]/20 text-[#B89B5E]', // Dusty Gold for TILT
  green: 'bg-[#4F5B4A]/10 border-[#4F5B4A]/20 text-[#4F5B4A]', // Muted Olive for PATIENCE/DISCIPLINE
  blue: 'bg-[#D6C7B2]/10 border-[#D6C7B2]/20 text-[#D6C7B2]', // Warm Sand for REGRET/CONFIDENT
  purple: 'bg-[#B89B5E]/10 border-[#B89B5E]/20 text-[#B89B5E]', // Dusty Gold for ANXIOUS
  gray: 'bg-[#4F5B4A]/10 border-[#4F5B4A]/20 text-[#4F5B4A]' // Muted Olive for NEUTRAL
};

interface EmotionDropdownProps {
  value: string[];
  onChange: (emotions: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function EmotionDropdown({
  value,
  onChange,
  placeholder = "Select emotions...",
  className = ""
}: EmotionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmotionToggle = (emotionKey: string) => {
    const newEmotions = value.includes(emotionKey)
      ? value.filter(e => e !== emotionKey)
      : [...value, emotionKey];
    onChange(newEmotions);
  };

  const handleRemoveEmotion = (emotionKey: string) => {
    const newEmotions = value.filter(e => e !== emotionKey);
    onChange(newEmotions);
  };

  const getEmotionDisplay = (emotionKey: string) => {
    return EMOTION_OPTIONS.find(opt => opt.key === emotionKey) || {
      key: emotionKey,
      label: emotionKey,
      color: 'gray'
    };
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div 
        className="w-full text-sm lg:text-base cursor-pointer flex items-center justify-between min-h-[48px] px-4 py-3 rounded-lg border border-[rgba(184,155,94,0.3)] bg-[var(--soft-graphite)] text-[var(--warm-off-white)] hover:border-[var(--dusty-gold)] focus:border-[var(--dusty-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--dusty-gold)]/20 transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span style={{ color: 'var(--warm-off-white)', opacity: 0.5 }}>{placeholder}</span>
          ) : (
            value.map(emotionKey => {
              const emotion = getEmotionDisplay(emotionKey);
              return (
                <span
                  key={emotionKey}
                  className={`px-2 py-1 rounded text-xs border ${COLOR_CLASSES[emotion.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.gray}`}
                >
                  {emotion.label}
                </span>
              );
            })
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--warm-off-white)' }} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg backdrop-blur-sm" style={{
          background: 'var(--soft-graphite)',
          border: '0.8px solid rgba(184, 155, 94, 0.3)'
        }}>
          <div className="max-h-60 overflow-y-auto p-2 scrollbar-glass">
            <div className="grid grid-cols-2 gap-2">
              {EMOTION_OPTIONS.map(emotion => (
                <button
                  key={emotion.key}
                  type="button"
                  onClick={() => handleEmotionToggle(emotion.key)}
                  className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                    value.includes(emotion.key)
                      ? COLOR_CLASSES[emotion.color as keyof typeof COLOR_CLASSES]
                      : 'hover:bg-[rgba(184,155,94,0.1)]'
                  }`}
                  style={{
                    color: value.includes(emotion.key) ? undefined : 'var(--warm-off-white)',
                    opacity: value.includes(emotion.key) ? 1 : 0.7
                  }}
                >
                  <span>{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}