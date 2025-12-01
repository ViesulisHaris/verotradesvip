'use client';

import React, { useState, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { 
  SortComponentProps, 
  SortConfig 
} from '@/lib/filtering-types';

export default function EnhancedSortControls({
  sortConfig,
  onSortChange,
  options,
  disabled = false,
  className = ''
}: SortComponentProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSortChange = useCallback((newSortConfig: SortConfig) => {
    if (disabled) return;
    
    // If clicking the same field, toggle direction
    if (newSortConfig.field === sortConfig.field) {
      const toggledConfig: SortConfig = {
        ...newSortConfig,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      };
      onSortChange(toggledConfig);
    } else {
      onSortChange(newSortConfig);
    }
    
    setIsDropdownOpen(false);
  }, [sortConfig, onSortChange, disabled]);

  const getSortIcon = (field: string, direction: 'asc' | 'desc') => {
    if (field === sortConfig.field) {
      return direction === 'asc' ? (
        <ArrowUp className="w-4 h-4 text-blue-400" />
      ) : (
        <ArrowDown className="w-4 h-4 text-blue-400" />
      );
    }
    return <ArrowUpDown className="w-4 h-4 text-white/50" />;
  };

  const getSortLabel = () => {
    const currentOption = options.find(opt => 
      opt.field === sortConfig.field && opt.direction === sortConfig.direction
    );
    return currentOption ? currentOption.label : 'Sort by...';
  };

  // Group options by field for better organization
  const groupedOptions = options.reduce((groups, option) => {
    const fieldName = option.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (!groups[fieldName]) {
      groups[fieldName] = [];
    }
    groups[fieldName].push(option);
    return groups;
  }, {} as Record<string, SortConfig[]>);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Compact Dropdown View */}
      <div className="relative">
        <CustomDropdown
          value={`${sortConfig.field}-${sortConfig.direction}`}
          onChange={(value) => {
            const [field, direction] = value.split('-');
            const option = options.find(opt => 
              opt.field === field && opt.direction === direction
            );
            if (option) {
              handleSortChange(option);
            }
          }}
          options={options.map(opt => ({
            value: `${opt.field}-${opt.direction}`,
            label: opt.label
          }))}
          placeholder="Sort by..."
          disabled={disabled}
          className="min-w-[200px]"
        />
      </div>

      {/* Individual Sort Buttons for Quick Access */}
      <div className="hidden lg:flex items-center gap-1">
        {Object.entries(groupedOptions).slice(0, 3).map(([fieldName, fieldOptions]) => {
          const primaryOption = fieldOptions[0]; // Use first option as primary
          const isActive = primaryOption.field === sortConfig.field;
          
          return (
            <button
              key={primaryOption.field}
              onClick={() => handleSortChange(primaryOption)}
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                isActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
              }`}
              title={`Sort by ${fieldName}`}
            >
              <span>{fieldName}</span>
              {getSortIcon(primaryOption.field, primaryOption.direction)}
            </button>
          );
        })}
      </div>

      {/* Advanced Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className="px-3 py-2 text-sm bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          title="Advanced sorting options"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="hidden sm:inline">More</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto rounded-xl shadow-2xl border border-white/10 bg-black/90 backdrop-blur-xl z-50 scrollbar-glass">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Sort Options</h4>
              
              {Object.entries(groupedOptions).map(([fieldName, fieldOptions]) => (
                <div key={fieldName} className="mb-4">
                  <h5 className="text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">
                    {fieldName}
                  </h5>
                  <div className="space-y-1">
                    {fieldOptions.map((option) => {
                      const isActive = option.field === sortConfig.field && 
                                     option.direction === sortConfig.direction;
                      
                      return (
                        <button
                          key={`${option.field}-${option.direction}`}
                          onClick={() => handleSortChange(option)}
                          disabled={disabled}
                          className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-all duration-200 flex items-center justify-between ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{option.label}</span>
                          {getSortIcon(option.field, option.direction)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

// Sort indicator component for table headers
interface SortIndicatorProps {
  field: string;
  currentSort: SortConfig;
  onSort: (field: string) => void;
  label: string;
  className?: string;
}

export function SortIndicator({ 
  field, 
  currentSort, 
  onSort, 
  label, 
  className = '' 
}: SortIndicatorProps) {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    if (isActive) {
      // Toggle direction if already active
      const newDirection = direction === 'asc' ? 'desc' : 'asc';
      onSort(`${field}-${newDirection}`);
    } else {
      // Set new field with default direction
      onSort(`${field}-desc`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 text-sm font-medium transition-all duration-200 rounded ${
        isActive 
          ? 'text-blue-400 bg-blue-600/10' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      } ${className}`}
      title={`Sort by ${label}`}
    >
      <span>{label}</span>
      <div className="flex flex-col">
        <ArrowUp 
          className={`w-3 h-3 transition-colors ${
            isActive && direction === 'asc' ? 'text-blue-400' : 'text-white/30'
          }`} 
        />
        <ArrowDown 
          className={`w-3 h-3 -mt-1 transition-colors ${
            isActive && direction === 'desc' ? 'text-blue-400' : 'text-white/30'
          }`} 
        />
      </div>
    </button>
  );
}

// Compact sort badge for showing current sort
export function SortBadge({ 
  sortConfig, 
  onClear, 
  className = '' 
}: { 
  sortConfig: SortConfig; 
  onClear: () => void; 
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full ${className}`}>
      <span className="truncate max-w-[150px]">{sortConfig.label}</span>
      <button
        onClick={onClear}
        className="hover:bg-blue-600/30 rounded-full p-0.5 transition-colors"
        title="Clear sort"
      >
        <ArrowUpDown className="w-3 h-3" />
      </button>
    </div>
  );
}