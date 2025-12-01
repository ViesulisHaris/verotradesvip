import React from 'react';

// Helper function to format emotions as boxes
export function formatEmotionsAsBoxes(emotionalState: string[] | null | string): React.JSX.Element {
  if (!emotionalState) {
    return <span className="text-gray-400">None</span>;
  }

  let emotions: string[] = [];
  
  if (Array.isArray(emotionalState)) {
    emotions = emotionalState
      .filter((e: any) => typeof e === 'string' && e.trim())
      .map((e: any) => e.trim().toUpperCase());
  } else if (typeof emotionalState === 'string') {
    const trimmed = emotionalState.trim();
    if (trimmed) {
      // Quick check if it's JSON format
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            emotions = parsed.map((e: any) => typeof e === 'string' ? e.trim().toUpperCase() : e);
          } else if (typeof parsed === 'string') {
            emotions = [parsed.trim().toUpperCase()];
          }
        } catch {
          emotions = [trimmed.toUpperCase()];
        }
      } else {
        emotions = [trimmed.toUpperCase()];
      }
    }
  }
  
  const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
    'FOMO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    'REVENGE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    'TILT': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    'OVERRISK': { bg: 'emotion-box-bg', text: 'emotion-box-text', border: 'border-yellow-500/50' },
    'PATIENCE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    'REGRET': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    'DISCIPLINE': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    'CONFIDENT': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    'ANXIOUS': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    'NEUTRAL': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
  };
  
  return (
    <div className="flex flex-wrap gap-tight">
      {emotions.map((emotion, index) => {
        const emotionColor = emotionColors[emotion] || emotionColors['NEUTRAL'];
        return (
          <div
            key={index}
            className={`px-2 py-1 rounded-md ${emotionColor.bg} ${emotionColor.text} text-xs border ${emotionColor.border}`}
          >
            {emotion}
          </div>
        );
      })}
    </div>
  );
}