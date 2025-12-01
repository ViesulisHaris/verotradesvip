'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface EmotionOption {
  value: string;
  label: string;
  color: string;
}

const EMOTION_OPTIONS: EmotionOption[] = [
  {
    value: 'FOMO',
    label: 'FOMO',
    color: 'yellow'
  },
  {
    value: 'REVENGE',
    label: 'Revenge',
    color: 'red'
  },
  {
    value: 'TILT',
    label: 'Tilt',
    color: 'orange'
  },
  {
    value: 'OVERRISK',
    label: 'Over Risk',
    color: 'red'
  },
  {
    value: 'PATIENCE',
    label: 'Patience',
    color: 'green'
  },
  {
    value: 'REGRET',
    label: 'Regret',
    color: 'blue'
  },
  {
    value: 'DISCIPLINE',
    label: 'Discipline',
    color: 'green'
  },
  {
    value: 'CONFIDENT',
    label: 'Confident',
    color: 'blue'
  },
  {
    value: 'ANXIOUS',
    label: 'Anxious',
    color: 'purple'
  },
  {
    value: 'NEUTRAL',
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

interface MultiSelectEmotionDropdownProps {
  value: string[];
  onChange: (emotions: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelectEmotionDropdown({
  value,
  onChange,
  placeholder = "Select emotions to filter...",
  className = ""
}: MultiSelectEmotionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: Event) => {
      if ((e as unknown as KeyboardEvent).key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < EMOTION_OPTIONS.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : EMOTION_OPTIONS.length - 1
          );
        }
        break;
      case 'Backspace':
        if (value.length > 0 && (!e.currentTarget.querySelector('input') || e.currentTarget.querySelector('input')?.value === '')) {
          // Remove the last selected emotion
          onChange(value.slice(0, -1));
        }
        break;
    }
  };

  const handleEmotionToggle = (emotionValue: string) => {
    const newEmotions = value.includes(emotionValue)
      ? value.filter(e => e !== emotionValue)
      : [...value, emotionValue];
    onChange(newEmotions);
  };

  const handleRemoveEmotion = (emotionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEmotions = value.filter(e => e !== emotionValue);
    onChange(newEmotions);
  };

  const handleOptionKeyDown = (e: KeyboardEvent<HTMLDivElement>, emotionValue: string, index: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleEmotionToggle(emotionValue);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(index < EMOTION_OPTIONS.length - 1 ? index + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(index > 0 ? index - 1 : EMOTION_OPTIONS.length - 1);
        break;
    }
  };

  const getEmotionColor = (emotionValue: string) => {
    const emotion = EMOTION_OPTIONS.find(opt => opt.value === emotionValue);
    return emotion ? emotion.color : 'gray';
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="dropdown-enhanced custom-dropdown w-full text-sm lg:text-base px-4 py-3 pr-4 text-left flex items-center justify-between appearance-none cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="emotion-dropdown-button"
      >
        <div className="flex flex-wrap gap-1 flex-1 items-center">
          {value.length === 0 ? (
            <span className="text-white/50 truncate">{placeholder}</span>
          ) : (
            value.map(emotionValue => {
              const color = getEmotionColor(emotionValue);
              return (
                <span
                  key={emotionValue}
                  className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${COLOR_CLASSES[color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.gray}`}
                >
                  {emotionValue}
                  <X
                    className="w-3 h-3 cursor-pointer hover:opacity-70"
                    onClick={(e) => handleRemoveEmotion(emotionValue, e)}
                  />
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ flexShrink: 0 }}
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          className="dropdown-options-container absolute z-50 w-full mt-1 max-h-none overflow-y-auto rounded-lg shadow-2xl border border-white/10 scrollbar-glass"
          style={{ maxHeight: '400px' }}
          role="listbox"
          aria-labelledby="emotion-dropdown-button"
          aria-activedescendant={highlightedIndex >= 0 ? `emotion-option-${highlightedIndex}` : undefined}
        >
          <div className="p-2">
            {EMOTION_OPTIONS.map((emotion, index) => (
              <div
                key={emotion.value}
                id={`emotion-option-${index}`}
                role="option"
                className={`dropdown-option px-3 py-2 cursor-pointer transition-all duration-200 text-sm lg:text-base flex items-center justify-between ${
                  value.includes(emotion.value) 
                    ? 'dropdown-option-selected' 
                    : highlightedIndex === index 
                      ? 'dropdown-option-highlighted' 
                      : 'dropdown-option-default'
                }`}
                onClick={() => handleEmotionToggle(emotion.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, emotion.value, index)}
                aria-selected={value.includes(emotion.value)}
              >
                <span>{emotion.label}</span>
                {value.includes(emotion.value) && (
                  <X className="w-3 h-3" />
                )}
              </div>
            ))}
          </div>
          
          {EMOTION_OPTIONS.length === 0 && (
            <div className="dropdown-option-empty px-4 py-3 text-sm text-white/50">
              No emotions available
            </div>
          )}
        </div>
      )}
    </div>
  );
}