'use client';

import { useState } from 'react';
import EmotionalStateInput from '@/components/ui/EmotionalStateInput';

export default function TestEmotionalStateInput() {
  const [emotions, setEmotions] = useState<string[]>([]);
  const [objectEmotions, setObjectEmotions] = useState<{ [key: string]: boolean }>({});
  const [stringEmotions, setStringEmotions] = useState<string>('');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Emotional State Input Test</h1>

        {/* Test 1: Array-based emotions */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test 1: Array-based Emotions</h2>
          <EmotionalStateInput
            value={emotions}
            onChange={(emotions) => setEmotions(Array.isArray(emotions) ? emotions : [])}
            placeholder="Select emotions..."
          />
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
            <p className="text-white font-medium">Selected Emotions (Array):</p>
            <p className="text-white/80">{JSON.stringify(emotions)}</p>
          </div>
        </div>

        {/* Test 2: Object-based emotions */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test 2: Object-based Emotions</h2>
          <EmotionalStateInput
            value={objectEmotions}
            onChange={(emotions) => {
              if (Array.isArray(emotions)) {
                // Convert array to object format
                const emotionObj: { [key: string]: boolean } = {};
                emotions.forEach(emotion => {
                  emotionObj[emotion] = true;
                });
                setObjectEmotions(emotionObj);
              } else {
                setObjectEmotions(emotions);
              }
            }}
            placeholder="Select emotions..."
          />
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
            <p className="text-white font-medium">Selected Emotions (Object):</p>
            <p className="text-white/80">{JSON.stringify(objectEmotions)}</p>
          </div>
        </div>

        {/* Test 3: String-based emotions */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test 3: String-based Emotions</h2>
          <EmotionalStateInput
            value={stringEmotions}
            onChange={(emotions) => setStringEmotions(Array.isArray(emotions) ? emotions.join(', ') : '')}
            placeholder="Select emotions..."
          />
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
            <p className="text-white font-medium">Selected Emotions (String):</p>
            <p className="text-white/80">{stringEmotions}</p>
          </div>
        </div>

        {/* Test 4: Pre-selected emotions */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test 4: Pre-selected Emotions</h2>
          <EmotionalStateInput
            value={['FOMO', 'DISCIPLINE', 'CONFIDENT']}
            onChange={(emotions) => console.log('Pre-selected emotions changed:', emotions)}
            placeholder="These emotions are pre-selected..."
          />
        </div>

        {/* Test 5: Custom emotion disabled */}
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Test 5: Custom Emotion Disabled</h2>
          <EmotionalStateInput
            value={emotions}
            onChange={(emotions) => setEmotions(Array.isArray(emotions) ? emotions : [])}
            placeholder="No custom emotions allowed..."
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => window.location.href = '/log-trade'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test in Trade Form
          </button>
          <button
            onClick={() => window.location.href = '/trades'}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Test in Edit Modal
          </button>
        </div>
      </div>
    </div>
  );
}