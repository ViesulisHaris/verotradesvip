'use client';

import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';

interface PerformanceSectionsProps {
  vRatingScore?: number;
  sharpeRatio?: number;
  dominantEmotion?: string;
  emotionData?: Record<string, number>;
  totalEmotions?: number;
}

const PerformanceSections: React.FC<PerformanceSectionsProps> = ({
  vRatingScore = 6.0,
  sharpeRatio = 0.51,
  dominantEmotion = 'OVERRISK',
  emotionData = {},
  totalEmotions = 0
}) => {
  // Calculate dominant emotion percentage
  const dominantEmotionCount = emotionData[dominantEmotion] || 0;
  const dominantEmotionPercentage = totalEmotions > 0 ? (dominantEmotionCount / totalEmotions * 100).toFixed(1) : '0.0';
  
  // Get top emotions for pills
  const topEmotions = Object.entries(emotionData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: totalEmotions > 0 ? (count / totalEmotions * 100).toFixed(0) : '0'
    }));

  return (
    <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* VRating Performance Card */}
      <div
        className="group relative overflow-hidden card-unified hover-lift transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-dusty-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-[#121212]"
        style={{
          background: 'var(--soft-graphite)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--spacing-card-inner)'
        }}
        role="article"
        aria-label={`VRating Performance: ${vRatingScore.toFixed(1)}/10 - Advanced`}
        tabIndex={0}
      >
        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(79, 91, 74, 0.1) 0%, rgba(184, 155, 94, 0.05) 100%)',
            borderRadius: 'var(--radius-card)'
          }}
        />
        <div className="flex items-center mb-4">
          <div
            className="w-4 h-4 rounded-full mr-2 transition-all duration-300 group-hover:scale-125"
            style={{ backgroundColor: 'var(--muted-olive)' }}
          />
          <h3
            className="text-sm font-medium transition-colors duration-300 group-hover:text-[var(--dusty-gold)]"
            style={{ color: 'var(--muted-gray)' }}
          >
            VRating Performance
          </h3>
        </div>
        
        <div className="mb-2">
          <div
            className="font-bold transition-all duration-300 group-hover:text-white group-hover:scale-105"
            style={{
              color: 'var(--warm-off-white)',
              fontSize: '36px',
              lineHeight: '1.2'
            }}
          >
            {vRatingScore.toFixed(1)} /10
          </div>
        </div>
        
        <div
          className="text-base font-medium mb-2 transition-colors duration-300 group-hover:text-[var(--warm-sand)]"
          style={{ color: 'var(--soft-olive-highlight)' }}
        >
          Advanced
        </div>
        
        <p 
          className="text-xs mb-4"
          style={{ color: 'var(--muted-gray)' }}
        >
          Competent trading with room for improvement
        </p>
        
        {/* Performance Scale */}
        <div className="relative">
          <div
            className="w-full h-2 rounded-full mb-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(to right, var(--rust-red), var(--muted-olive), var(--dusty-gold))',
              height: '8px',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Animated glow effect */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(184, 155, 94, 0.3), transparent)',
                animation: 'shimmer 2s infinite'
              }}
            />
            {/* Enhanced marker with shadow and animation */}
            <div
              className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125"
              style={{
                left: `${(vRatingScore / 10) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--warm-off-white)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 2px var(--border-primary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Inner dot for visual enhancement */}
              <div
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'var(--dusty-gold)',
                  opacity: 0.8
                }}
              />
            </div>
          </div>
          
          {/* Enhanced scale numbers with better spacing */}
          <div className="flex justify-between text-xs" style={{ color: 'var(--muted-gray)', marginTop: '8px' }}>
            <span className="font-medium">1</span>
            <span className="font-medium">2</span>
            <span className="font-medium">3</span>
            <span className="font-medium">4</span>
            <span className="font-medium">5</span>
            <span className="font-medium">6</span>
            <span className="font-medium">7</span>
            <span className="font-medium">8</span>
            <span className="font-medium">9</span>
            <span className="font-medium">10</span>
          </div>
        </div>
      </div>

      {/* Sharpe Ratio Card */}
      <div
        className="group relative overflow-hidden card-unified hover-lift transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-dusty-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-[#121212]"
        style={{
          background: 'var(--soft-graphite)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--spacing-card-inner)'
        }}
        role="article"
        aria-label={`Sharpe Ratio: ${sharpeRatio.toFixed(2)} - Acceptable`}
        tabIndex={0}
      >
        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(214, 199, 178, 0.1) 0%, rgba(184, 155, 94, 0.05) 100%)',
            borderRadius: 'var(--radius-card)'
          }}
        />
        <div className="flex items-center mb-4">
          <TrendingUp
            size={16}
            className="mr-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
            style={{ color: '#9A9A9A' }}
          />
          <h3
            className="text-sm font-medium transition-colors duration-300 group-hover:text-[var(--warm-sand)]"
            style={{ color: 'var(--muted-gray)' }}
          >
            Sharpe Ratio
          </h3>
        </div>
        
        <div className="mb-2">
          <div
            className="font-bold transition-all duration-300 group-hover:text-white group-hover:scale-105"
            style={{
              color: 'var(--warm-off-white)',
              fontSize: '36px',
              lineHeight: '1.2'
            }}
          >
            {sharpeRatio.toFixed(2)}
          </div>
        </div>
        
        <div
          className="text-base font-medium mb-2 transition-colors duration-300 group-hover:text-[var(--dusty-gold)]"
          style={{ color: 'var(--warm-sand)' }}
        >
          Acceptable
        </div>
        
        <div className="mb-4">
          <p 
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--muted-gray)' }}
          >
            Risk-Adjusted Performance
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--muted-gray)' }}
          >
            Moderate risk-adjusted returns
          </p>
        </div>
        
        {/* Sharpe Ratio Scale */}
        <div className="relative">
          <div
            className="w-full h-2 rounded-full mb-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(to right, var(--rust-red), var(--muted-olive), var(--dusty-gold))',
              height: '8px',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Animated glow effect */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(214, 199, 178, 0.3), transparent)',
                animation: 'shimmer 2s infinite'
              }}
            />
            {/* Enhanced marker with shadow and animation */}
            <div
              className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125"
              style={{
                left: `${((sharpeRatio + 2) / 4) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--warm-off-white)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 2px var(--border-primary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Inner dot for visual enhancement */}
              <div
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'var(--warm-sand)',
                  opacity: 0.8
                }}
              />
            </div>
          </div>
          
          {/* Enhanced scale numbers with better spacing */}
          <div className="flex justify-between text-xs" style={{ color: 'var(--muted-gray)', marginTop: '8px' }}>
            <span className="font-medium">-2.0</span>
            <span className="font-medium">-1.0</span>
            <span className="font-medium">0</span>
            <span className="font-medium">1.0</span>
            <span className="font-medium">2.0</span>
          </div>
        </div>
      </div>

      {/* Dominant Emotion Card */}
      <div
        className="group relative overflow-hidden card-unified hover-lift transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-dusty-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-[#121212]"
        style={{
          background: 'var(--soft-graphite)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--spacing-card-inner)'
        }}
        role="article"
        aria-label={`Dominant Emotion: ${dominantEmotion} - ${dominantEmotionPercentage}% of all emotions`}
        tabIndex={0}
      >
        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 53, 45, 0.1) 0%, rgba(184, 155, 94, 0.05) 100%)',
            borderRadius: 'var(--radius-card)'
          }}
        />
        <div className="flex items-center mb-4">
          <Brain
            size={16}
            className="mr-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
            style={{ color: 'var(--rust-red)' }}
          />
          <h3
            className="text-sm font-medium transition-colors duration-300 group-hover:text-[var(--warm-off-white)]"
            style={{ color: 'var(--muted-gray)' }}
          >
            Dominant Emotion
          </h3>
        </div>
        
        <div className="mb-2">
          <div
            className="inline-block px-3 py-1 rounded-full font-bold transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
            style={{
              color: 'var(--warm-off-white)',
              fontSize: '24px',
              backgroundColor: 'var(--rust-red)'
            }}
          >
            {dominantEmotion}
          </div>
        </div>
        
        <p 
          className="text-xs mb-4"
          style={{ color: 'var(--muted-gray)' }}
        >
          {dominantEmotionPercentage}% of all emotions
        </p>
        
        {/* Emotion Distribution */}
        <div className="mb-3">
          <p
            className="text-xs font-medium mb-2"
            style={{ color: '#9A9A9A' }}
          >
            Emotion Distribution
          </p>
          <div
            className="w-full h-2 rounded-full relative overflow-hidden"
            style={{
              backgroundColor: 'var(--rust-red)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Animated glow overlay */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(167, 53, 45, 0.2), transparent)',
                animation: 'shimmer 3s infinite'
              }}
            />
            {/* Enhanced segmented bar showing emotion distribution */}
            {topEmotions.map((emotion, index) => (
              <div
                key={emotion.emotion}
                className="h-full inline-block relative transition-all duration-300 hover:opacity-80"
                style={{
                  width: `${emotion.percentage}%`,
                  backgroundColor:
                    emotion.emotion === 'CONFIDENT' ? 'var(--dusty-gold)' :
                    emotion.emotion === 'REGRET' ? 'var(--rust-red)' :
                    emotion.emotion === 'OVERRISK' ? 'var(--rust-red)' :
                    emotion.emotion === 'PATIENCE' ? 'var(--muted-olive)' :
                    emotion.emotion === 'DISCIPLINE' ? 'var(--soft-olive-highlight)' :
                    'var(--muted-gray)',
                  boxShadow: index === 0 ? 'inset -1px 0 0 rgba(0, 0, 0, 0.2)' : 'none'
                }}
              >
                {/* Subtle inner gradient for depth */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Emotion Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {topEmotions.map((emotion) => (
            <div
              key={emotion.emotion}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                color: 'var(--warm-off-white)',
                backgroundColor:
                  emotion.emotion === 'CONFIDENT' ? 'var(--dusty-gold)' :
                  emotion.emotion === 'REGRET' ? 'var(--rust-red)' :
                  'var(--muted-gray)'
              }}
            >
              {emotion.emotion} ({emotion.percentage}%)
            </div>
          ))}
        </div>
        
        {/* Occurrence count */}
        <p 
          className="text-xs"
          style={{ color: 'var(--muted-gray)' }}
        >
          {dominantEmotionCount} occurrences
        </p>
      </div>
    </div>
  );
};

export default PerformanceSections;