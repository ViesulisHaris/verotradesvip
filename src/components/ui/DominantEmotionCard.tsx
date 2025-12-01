'use client';

import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';

interface Props {
  emotion: string;
  emotionData: Record<string, number>;
}

// Emotion color mapping for visual representation - Updated to warm color palette
const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
  'FOMO': { bg: 'bg-[#D6C7B2]/20', text: 'text-[#D6C7B2]', border: 'border-[#D6C7B2]/50' }, // Warm Sand
  'REVENGE': { bg: 'bg-[#A7352D]/20', text: 'text-[#A7352D]', border: 'border-[#A7352D]/50' }, // Rust Red
  'TILT': { bg: 'bg-[#B89B5E]/20', text: 'text-[#B89B5E]', border: 'border-[#B89B5E]/50' }, // Dusty Gold
  'OVERRISK': { bg: 'emotion-box-bg', text: 'emotion-box-text', border: 'border-[#A7352D]/50' }, // Rust Red (uses existing CSS vars)
  'PATIENCE': { bg: 'bg-[#4F5B4A]/20', text: 'text-[#4F5B4A]', border: 'border-[#4F5B4A]/50' }, // Muted Olive
  'REGRET': { bg: 'bg-[#D6C7B2]/20', text: 'text-[#D6C7B2]', border: 'border-[#D6C7B2]/50' }, // Warm Sand
  'DISCIPLINE': { bg: 'bg-[#4F5B4A]/20', text: 'text-[#4F5B4A]', border: 'border-[#4F5B4A]/50' }, // Muted Olive
  'CONFIDENT': { bg: 'bg-[#D6C7B2]/20', text: 'text-[#D6C7B2]', border: 'border-[#D6C7B2]/50' }, // Warm Sand
  'ANXIOUS': { bg: 'bg-[#B89B5E]/20', text: 'text-[#B89B5E]', border: 'border-[#B89B5E]/50' }, // Dusty Gold
  'NEUTRAL': { bg: 'bg-[#4F5B4A]/20', text: 'text-[#4F5B4A]', border: 'border-[#4F5B4A]/50' }, // Muted Olive
  'None': { bg: 'bg-[#4F5B4A]/20', text: 'text-[#4F5B4A]', border: 'border-[#4F5B4A]/50' } // Muted Olive
};

export default function DominantEmotionCard({ emotion, emotionData }: Props) {
  const emotionColor = emotionColors[emotion] || emotionColors['None'];
  const totalEmotions = Object.values(emotionData).reduce((sum, count) => sum + count, 0);
  const emotionCount = emotionData[emotion] || 0;
  const emotionPercentage = totalEmotions > 0 ? ((emotionCount / totalEmotions) * 100).toFixed(1) : '0';

  return (
    <div
      className="group relative overflow-hidden rounded-xl card-solid"
    >
      {/* Enhanced top accent border with emotion-specific gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${emotionColor.bg} pointer-events-none`}
        style={{
          height: '2px',
          background: emotion === 'OVERRISK' ? 'linear-gradient(90deg, #A7352D, #B89B5E)' :
                   emotion === 'FOMO' ? 'linear-gradient(90deg, #D6C7B2, #E6D7C3)' :
                   emotion === 'REVENGE' ? 'linear-gradient(90deg, #A7352D, #C85A3C)' :
                   emotion === 'TILT' ? 'linear-gradient(90deg, #B89B5E, #D6C7B2)' :
                   emotion === 'PATIENCE' ? 'linear-gradient(90deg, #4F5B4A, #6A7661)' :
                   emotion === 'DISCIPLINE' ? 'linear-gradient(90deg, #4F5B4A, #6A7661)' :
                   emotion === 'CONFIDENT' ? 'linear-gradient(90deg, #D6C7B2, #E6D7C3)' :
                   emotion === 'ANXIOUS' ? 'linear-gradient(90deg, #B89B5E, #D6C7B2)' :
                   'linear-gradient(90deg, #4F5B4A, #6A7661)'
        }}
      />
      
      {/* Card content with enhanced styling */}
      <div className="relative p-5" style={{ background: 'rgba(32, 32, 32, 0.95)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium metric-label group-hover:text-gray-300 transition-colors duration-200">
              Dominant Emotion
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className={`p-3 rounded-lg border`} style={{
                background: emotion === 'OVERRISK' ? 'rgba(43, 20, 18, 0.8)' :
                           emotion === 'FOMO' ? 'rgba(214, 199, 178, 0.2)' :
                           emotion === 'REVENGE' ? 'rgba(167, 53, 45, 0.2)' :
                           emotion === 'TILT' ? 'rgba(184, 155, 94, 0.2)' :
                           emotion === 'PATIENCE' ? 'rgba(79, 91, 74, 0.2)' :
                           emotion === 'DISCIPLINE' ? 'rgba(79, 91, 74, 0.2)' :
                           emotion === 'CONFIDENT' ? 'rgba(214, 199, 178, 0.2)' :
                           emotion === 'ANXIOUS' ? 'rgba(184, 155, 94, 0.2)' :
                           'rgba(79, 91, 74, 0.2)',
                border: emotion === 'OVERRISK' ? '1px solid rgba(167, 53, 45, 0.6)' :
                         emotion === 'FOMO' ? '1px solid rgba(214, 199, 178, 0.4)' :
                         emotion === 'REVENGE' ? '1px solid rgba(167, 53, 45, 0.4)' :
                         emotion === 'TILT' ? '1px solid rgba(184, 155, 94, 0.4)' :
                         emotion === 'PATIENCE' ? '1px solid rgba(79, 91, 74, 0.4)' :
                         emotion === 'DISCIPLINE' ? '1px solid rgba(79, 91, 74, 0.4)' :
                         emotion === 'CONFIDENT' ? '1px solid rgba(214, 199, 178, 0.4)' :
                         emotion === 'ANXIOUS' ? '1px solid rgba(184, 155, 94, 0.4)' :
                         '1px solid rgba(79, 91, 74, 0.4)'
              }}>
                <Brain className={`w-6 h-6`} style={{
                  color: emotion === 'OVERRISK' ? '#B89B5E' :
                         emotion === 'FOMO' ? '#D6C7B2' :
                         emotion === 'REVENGE' ? '#A7352D' :
                         emotion === 'TILT' ? '#B89B5E' :
                         emotion === 'PATIENCE' ? '#4F5B4A' :
                         emotion === 'DISCIPLINE' ? '#4F5B4A' :
                         emotion === 'CONFIDENT' ? '#D6C7B2' :
                         emotion === 'ANXIOUS' ? '#B89B5E' :
                         '#4F5B4A'
                }} />
              </div>
              <div>
                <p className={`text-xl font-bold transition-colors duration-200`} style={{
                  color: emotion === 'OVERRISK' ? '#A7352D' :
                         emotion === 'FOMO' ? '#D6C7B2' :
                         emotion === 'REVENGE' ? '#A7352D' :
                         emotion === 'TILT' ? '#B89B5E' :
                         emotion === 'PATIENCE' ? '#4F5B4A' :
                         emotion === 'DISCIPLINE' ? '#4F5B4A' :
                         emotion === 'CONFIDENT' ? '#D6C7B2' :
                         emotion === 'ANXIOUS' ? '#B89B5E' :
                         '#4F5B4A'
                }}>
                  {emotion}
                </p>
                <p className="text-xs metric-label mt-1">
                  {emotionPercentage}% of all emotions
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced trend indicator */}
          <div className="p-2 rounded-lg" style={{
            background: 'rgba(43, 43, 43, 0.3)',
            border: '1px solid rgba(43, 43, 43, 0.2)'
          }}>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        {/* Enhanced emotion distribution bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs metric-label mb-2">
            <span>Emotion Distribution</span>
            <span>{emotionCount} occurrences</span>
          </div>
          <div
            className="w-full rounded-full h-2 overflow-hidden"
            style={{ background: 'rgba(43, 43, 43, 0.3)' }}
          >
            <div
              className={`h-full transition-all duration-700 ease-out relative`}
              style={{
                width: `${emotionPercentage}%`,
                background: emotion === 'OVERRISK' ? 'linear-gradient(90deg, #A7352D, #B89B5E)' :
                         emotion === 'FOMO' ? 'linear-gradient(90deg, #D6C7B2, #E6D7C3)' :
                         emotion === 'REVENGE' ? 'linear-gradient(90deg, #A7352D, #C85A3C)' :
                         emotion === 'TILT' ? 'linear-gradient(90deg, #B89B5E, #D6C7B2)' :
                         emotion === 'PATIENCE' ? 'linear-gradient(90deg, #4F5B4A, #6A7661)' :
                         emotion === 'DISCIPLINE' ? 'linear-gradient(90deg, #4F5B4A, #6A7661)' :
                         emotion === 'CONFIDENT' ? 'linear-gradient(90deg, #D6C7B2, #E6D7C3)' :
                         emotion === 'ANXIOUS' ? 'linear-gradient(90deg, #B89B5E, #D6C7B2)' :
                         'linear-gradient(90deg, #4F5B4A, #6A7661)',
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                className="absolute right-0 top-0 bottom-0 w-0.5"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Enhanced other emotions preview */}
        {Object.keys(emotionData).length > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs metric-label mb-2">Other emotions:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(emotionData)
                .filter(([key]) => key !== emotion)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([key, count]) => {
                  const otherPercentage = totalEmotions > 0 ? ((count / totalEmotions) * 100).toFixed(0) : '0';
                  return (
                    <div
                      key={key}
                      className="px-2 py-1 rounded-md text-xs border"
                      style={{
                        background: key === 'OVERRISK' ? 'rgba(43, 20, 18, 0.8)' :
                                   key === 'FOMO' ? 'rgba(214, 199, 178, 0.2)' :
                                   key === 'REVENGE' ? 'rgba(167, 53, 45, 0.2)' :
                                   key === 'TILT' ? 'rgba(184, 155, 94, 0.2)' :
                                   key === 'PATIENCE' ? 'rgba(79, 91, 74, 0.2)' :
                                   key === 'DISCIPLINE' ? 'rgba(79, 91, 74, 0.2)' :
                                   key === 'CONFIDENT' ? 'rgba(214, 199, 178, 0.2)' :
                                   key === 'ANXIOUS' ? 'rgba(184, 155, 94, 0.2)' :
                                   'rgba(79, 91, 74, 0.2)',
                        color: key === 'OVERRISK' ? '#A7352D' :
                               key === 'FOMO' ? '#D6C7B2' :
                               key === 'REVENGE' ? '#A7352D' :
                               key === 'TILT' ? '#B89B5E' :
                               key === 'PATIENCE' ? '#4F5B4A' :
                               key === 'DISCIPLINE' ? '#4F5B4A' :
                               key === 'CONFIDENT' ? '#D6C7B2' :
                               key === 'ANXIOUS' ? '#B89B5E' :
                               '#6A7661',
                        border: key === 'OVERRISK' ? '1px solid rgba(167, 53, 45, 0.6)' :
                                key === 'FOMO' ? '1px solid rgba(214, 199, 178, 0.4)' :
                                key === 'REVENGE' ? '1px solid rgba(167, 53, 45, 0.4)' :
                                key === 'TILT' ? '1px solid rgba(184, 155, 94, 0.4)' :
                                key === 'PATIENCE' ? '1px solid rgba(79, 91, 74, 0.4)' :
                                key === 'DISCIPLINE' ? '1px solid rgba(79, 91, 74, 0.4)' :
                                key === 'CONFIDENT' ? '1px solid rgba(214, 199, 178, 0.4)' :
                                key === 'ANXIOUS' ? '1px solid rgba(184, 155, 94, 0.4)' :
                                '1px solid rgba(79, 91, 74, 0.4)'
                      }}
                    >
                      {key} ({otherPercentage}%)
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}