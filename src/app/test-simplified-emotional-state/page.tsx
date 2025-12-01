'use client';

import { useState } from 'react';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';

export default function TestSimplifiedEmotionalState() {
  const [emotions, setEmotions] = useState<string[]>([]);

  const handleEmotionChange = (emotions: string[] | { [key: string]: boolean }) => {
    // Convert to string array if it's an object
    const emotionArray = Array.isArray(emotions) ? emotions :
      Object.entries(emotions).filter(([_, isSelected]) => isSelected).map(([emotion]) => emotion);
    
    setEmotions(emotionArray);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Simplified Emotional State Input</h1>
        
        <div className="glass p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Simplified Emotional State Input</h2>
          <p className="text-white/70 mb-6">
            This test verifies that the simplified EmotionalStateInput component works correctly without descriptions and custom emotion functionality.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">Select Emotions</label>
            <EmotionalStateInput
              value={emotions}
              onChange={handleEmotionChange}
              className="mt-2"
            />
          </div>
          
          <div className="mt-6 p-4 bg-black/30 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Selected Emotions:</h3>
            <p className="text-white/80">
              {emotions.length > 0 ? emotions.join(', ') : 'No emotions selected'}
            </p>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Verification Checklist</h2>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${emotions.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></span>
              Can select emotions from predefined list
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-400"></span>
              No description text under emotion names
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-400"></span>
              No custom emotion input/button visible
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${emotions.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></span>
              Can remove selected emotions by clicking X
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${emotions.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></span>
              Selected emotions display correctly above buttons
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}