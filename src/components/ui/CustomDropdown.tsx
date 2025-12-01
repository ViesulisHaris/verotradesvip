'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

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
    if (disabled) return;

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
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleOptionKeyDown = (e: KeyboardEvent<HTMLDivElement>, optionValue: string, index: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleOptionClick(optionValue);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(index < options.length - 1 ? index + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(index > 0 ? index - 1 : options.length - 1);
        break;
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full text-sm lg:text-base px-4 py-3 pr-4 text-left flex items-center justify-between appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-[rgba(184,155,94,0.3)] bg-[var(--soft-graphite)] text-[var(--warm-off-white)] hover:border-[var(--dusty-gold)] focus:border-[var(--dusty-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--dusty-gold)]/20 transition-all duration-300"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="dropdown-button"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ flexShrink: 0 }}
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg shadow-2xl border border-[rgba(184,155,94,0.3)] bg-[var(--soft-graphite)] backdrop-blur-sm scrollbar-glass"
          role="listbox"
          aria-labelledby="dropdown-button"
          aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`option-${index}`}
              role="option"
              className={`px-4 py-3 cursor-pointer transition-all duration-200 text-sm lg:text-base ${
                option.value === value
                  ? 'bg-[var(--dusty-gold)]/20 text-[var(--dusty-gold)] border-l-2 border-[var(--dusty-gold)]'
                  : highlightedIndex === index
                    ? 'bg-[rgba(184,155,94,0.1)] text-[var(--warm-off-white)] hover:bg-[rgba(184,155,94,0.2)]'
                    : 'text-[var(--warm-off-white)]/70 hover:text-[var(--warm-off-white)] hover:bg-[rgba(184,155,94,0.05)]'
              }`}
              onClick={() => handleOptionClick(option.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, option.value, index)}
              aria-selected={option.value === value}
            >
              {option.label}
            </div>
          ))}
          
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-[var(--warm-off-white)]/50">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}