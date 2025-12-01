'use client';

import React, { useState } from 'react';
import MultiSelectEmotionDropdown from '@/components/ui/MultiSelectEmotionDropdown';

export default function TestEmotionDropdown() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Emotion Dropdown Test</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">MultiSelectEmotionDropdown Test</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-2">
              Select Emotions:
            </label>
            <MultiSelectEmotionDropdown
              value={selectedEmotions}
              onChange={setSelectedEmotions}
              placeholder="Select emotions to test..."
            />
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-2">Selected Emotions:</h3>
            <div className="bg-black/20 p-4 rounded-lg">
              {selectedEmotions.length > 0 ? (
                <ul className="space-y-1">
                  {selectedEmotions.map((emotion, index) => (
                    <li key={index} className="text-white">
                      {index + 1}. {emotion}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/50">No emotions selected</p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-2">Test Instructions:</h3>
            <ul className="list-disc list-inside text-white/80 space-y-1">
              <li>Click on the dropdown to open it</li>
              <li>Verify all 10 emotions are visible: FOMO, Revenge, Tilt, Over Risk, Patience, Regret, Discipline, Confident, Anxious, Neutral</li>
              <li>Check if a scrollbar appears when needed</li>
              <li>Try selecting multiple emotions</li>
              <li>Try removing emotions by clicking the X button</li>
              <li>Test keyboard navigation (Arrow keys, Enter, Escape)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}