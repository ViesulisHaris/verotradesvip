'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  Brain, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Star,
  Trophy,
  Award,
  Zap,
  Info
} from 'lucide-react';

// Type definitions for VRating data structure
export interface VRatingCategory {
  name: string;
  score: number; // 1-10
  weight: number; // Percentage weight
  contribution: number; // Weighted contribution to overall score
  keyMetrics: string[];
  icon: React.ComponentType<any>;
}

export interface VRatingAdjustment {
  type: 'bonus' | 'penalty';
  description: string;
  value: number;
}

export interface VRatingData {
  overallScore: number; // 1-10
  categories: {
    profitability: VRatingCategory;
    riskManagement: VRatingCategory;
    consistency: VRatingCategory;
    emotionalDiscipline: VRatingCategory;
    journalingAdherence: VRatingCategory;
  };
  adjustments: VRatingAdjustment[];
  calculatedAt: string;
}

interface Props {
  vRatingData: VRatingData;
  className?: string;
}

export default function VRatingCard({ vRatingData, className = "" }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine category performance level for highlighting
  const getCategoryPerformanceLevel = (score: number) => {
    if (score >= 7.0) {
      return {
        level: 'good',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        indicatorColor: 'bg-green-500',
        label: 'Meets Rules'
      };
    } else if (score >= 5.0) {
      return {
        level: 'medium',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        indicatorColor: 'bg-yellow-500',
        label: 'Medium'
      };
    } else {
      return {
        level: 'poor',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        indicatorColor: 'bg-red-500',
        label: "Doesn't Meet"
      };
    }
  };

  // Determine performance level and colors based on overall score
  const getPerformanceLevel = () => {
    const score = vRatingData.overallScore;
    
    if (score >= 9) {
      return {
        level: 'Elite',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/50',
        gaugeColor: 'bg-gradient-to-r from-purple-600 to-purple-400',
        icon: Trophy,
        description: 'Exceptional trading performance across all metrics'
      };
    } else if (score >= 7.5) {
      return {
        level: 'Expert',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        gaugeColor: 'bg-gradient-to-r from-blue-600 to-blue-400',
        icon: Star,
        description: 'Advanced trading skills with consistent results'
      };
    } else if (score >= 6) {
      return {
        level: 'Advanced',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/50',
        gaugeColor: 'bg-gradient-to-r from-green-600 to-green-400',
        icon: Award,
        description: 'Competent trading with room for improvement'
      };
    } else if (score >= 4.5) {
      return {
        level: 'Developing',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/50',
        gaugeColor: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
        icon: Target,
        description: 'Building foundational trading skills'
      };
    } else if (score >= 3) {
      return {
        level: 'Novice',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/50',
        gaugeColor: 'bg-gradient-to-r from-orange-600 to-orange-400',
        icon: Zap,
        description: 'Early stage trading journey'
      };
    } else {
      return {
        level: 'Beginner',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        gaugeColor: 'bg-gradient-to-r from-red-600 to-red-400',
        icon: TrendingUp,
        description: 'Starting your trading journey'
      };
    }
  };

  const performanceLevel = getPerformanceLevel();
  const LevelIcon = performanceLevel.icon;

  // Calculate gauge width (1-10 scale)
  const gaugeWidth = ((vRatingData.overallScore - 1) / 9) * 100;

  // Prepare category data with icons (colors will be determined by performance level)
  const categoriesWithIcons = [
    {
      ...vRatingData.categories.profitability,
      key: 'profitability',
      icon: TrendingUp
    },
    {
      ...vRatingData.categories.riskManagement,
      key: 'riskManagement',
      icon: Shield
    },
    {
      ...vRatingData.categories.consistency,
      key: 'consistency',
      icon: Target
    },
    {
      ...vRatingData.categories.emotionalDiscipline,
      key: 'emotionalDiscipline',
      icon: Brain
    },
    {
      ...vRatingData.categories.journalingAdherence,
      key: 'journalingAdherence',
      icon: BookOpen
    }
  ];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl card-solid ${className}`}
    >
      {/* Enhanced top accent border with performance-specific gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${performanceLevel.bgColor} pointer-events-none`}
        style={{
          height: '2px',
          background: vRatingData.overallScore >= 9 ? 'linear-gradient(90deg, #9333EA, #A855F7)' :
                   vRatingData.overallScore >= 7.5 ? 'linear-gradient(90deg, #3B82F6, #60A5FA)' :
                   vRatingData.overallScore >= 6 ? 'linear-gradient(90deg, #10B981, #34D399)' :
                   vRatingData.overallScore >= 4.5 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' :
                   vRatingData.overallScore >= 3 ? 'linear-gradient(90deg, #F97316, #FB923C)' :
                   'linear-gradient(90deg, #EF4444, #DC2626)'
        }}
      />
      
      {/* Card content with enhanced styling */}
      <div
        className="relative p-6"
        style={{ background: 'rgba(32, 32, 32, 0.95)' }}
      >
        {/* Enhanced header with overall score */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold title-main mb-2 flex items-center gap-2">
              <LevelIcon className={`w-5 h-5`} style={{
                color: vRatingData.overallScore >= 9 ? '#9333EA' :
                       vRatingData.overallScore >= 7.5 ? '#3B82F6' :
                       vRatingData.overallScore >= 6 ? '#10B981' :
                       vRatingData.overallScore >= 4.5 ? '#F59E0B' :
                       vRatingData.overallScore >= 3 ? '#F97316' :
                       '#EF4444'
              }} />
              VRating Performance
            </h3>
            <div className="flex items-baseline gap-4">
              <div className="relative">
                <span className={`text-4xl font-bold transition-colors duration-200`} style={{
                  color: vRatingData.overallScore >= 9 ? '#9333EA' :
                         vRatingData.overallScore >= 7.5 ? '#3B82F6' :
                         vRatingData.overallScore >= 6 ? '#10B981' :
                         vRatingData.overallScore >= 4.5 ? '#F59E0B' :
                         vRatingData.overallScore >= 3 ? '#F97316' :
                         '#EF4444'
                }}>
                  {vRatingData.overallScore.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400 ml-1">/10</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium`} style={{
                  color: vRatingData.overallScore >= 9 ? '#9333EA' :
                         vRatingData.overallScore >= 7.5 ? '#3B82F6' :
                         vRatingData.overallScore >= 6 ? '#10B981' :
                         vRatingData.overallScore >= 4.5 ? '#F59E0B' :
                         vRatingData.overallScore >= 3 ? '#F97316' :
                         '#EF4444'
                }}>
                  {performanceLevel.level}
                </span>
                <span className="text-xs text-gray-400">
                  {performanceLevel.description}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced VRating gauge */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs metric-label mb-2">
            <span>Performance Scale</span>
            <span>Score: {vRatingData.overallScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full rounded-full h-4 overflow-hidden relative" style={{ background: 'rgba(43, 43, 43, 0.3)' }}>
            {/* Enhanced background gradient zones */}
            <div className="absolute inset-0 flex">
              <div className="w-1/6" style={{ background: 'rgba(239, 68, 68, 0.3)' }}></div>
              <div className="w-1/6" style={{ background: 'rgba(249, 115, 22, 0.3)' }}></div>
              <div className="w-1/6" style={{ background: 'rgba(245, 158, 11, 0.3)' }}></div>
              <div className="w-1/6" style={{ background: 'rgba(16, 185, 129, 0.3)' }}></div>
              <div className="w-1/6" style={{ background: 'rgba(59, 130, 246, 0.3)' }}></div>
              <div className="w-1/6" style={{ background: 'rgba(147, 51, 234, 0.3)' }}></div>
            </div>
            {/* Enhanced animated value indicator */}
            <div
              className={`h-full transition-all duration-700 ease-out relative`}
              style={{
                width: `${gaugeWidth}%`,
                background: vRatingData.overallScore >= 9 ? 'linear-gradient(90deg, #9333EA, transparent)' :
                         vRatingData.overallScore >= 7.5 ? 'linear-gradient(90deg, #3B82F6, transparent)' :
                         vRatingData.overallScore >= 6 ? 'linear-gradient(90deg, #10B981, transparent)' :
                         vRatingData.overallScore >= 4.5 ? 'linear-gradient(90deg, #F59E0B, transparent)' :
                         vRatingData.overallScore >= 3 ? 'linear-gradient(90deg, #F97316, transparent)' :
                         'linear-gradient(90deg, #EF4444, transparent)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                className="absolute right-0 top-0 bottom-0 w-1"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.6)'
                }}
              ></div>
            </div>
          </div>
          
          {/* Enhanced scale markers */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>9</span>
            <span>10</span>
          </div>
        </div>


        {/* Adjustments summary */}
        {vRatingData.adjustments.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-secondary border border-secondary">
            <h4 className="text-sm font-medium title-subtitle mb-2">Adjustments</h4>
            <div className="space-y-1">
              {vRatingData.adjustments.map((adjustment, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{adjustment.description}</span>
                  <span className={`font-medium ${
                    adjustment.type === 'bonus' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {adjustment.type === 'bonus' ? '+' : ''}{adjustment.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable breakdown section */}
        <div className="border-t border-secondary pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm font-medium title-subtitle hover:text-primary transition-colors duration-200"
          >
            <span>Performance Breakdown</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Categories needing attention - only visible when expanded */}
              <div className="mb-4">
                {(() => {
                  const poorCategories = categoriesWithIcons.filter(cat => cat.score < 5.0);
                  const mediumCategories = categoriesWithIcons.filter(cat => cat.score >= 5.0 && cat.score < 7.0);
                  
                  if (poorCategories.length > 0 || mediumCategories.length > 0) {
                    return (
                      <div className={`p-3 rounded-lg border ${
                        poorCategories.length > 0
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-yellow-500/10 border-yellow-500/30'
                      }`}>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          {poorCategories.length > 0 ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-400">Needs Immediate Attention</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="metric-label">Areas for Improvement</span>
                            </>
                          )}
                        </h4>
                        
                        {/* Poor performing categories */}
                        {poorCategories.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {poorCategories.map(category => {
                              const CategoryIcon = category.icon;
                              const performanceLevel = getCategoryPerformanceLevel(category.score);
                              return (
                                <div key={category.key} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <CategoryIcon className={`w-3 h-3 ${performanceLevel.color}`} />
                                    <span className={performanceLevel.color}>{category.name}</span>
                                  </div>
                                  <span className={`${performanceLevel.color} font-medium`}>{category.score.toFixed(1)}/10</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Medium performing categories */}
                        {mediumCategories.length > 0 && (
                          <div className="space-y-1">
                            {mediumCategories.map(category => {
                              const CategoryIcon = category.icon;
                              const performanceLevel = getCategoryPerformanceLevel(category.score);
                              return (
                                <div key={category.key} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <CategoryIcon className={`w-3 h-3 ${performanceLevel.color}`} />
                                    <span className={performanceLevel.color}>{category.name}</span>
                                  </div>
                                  <span className={`${performanceLevel.color} font-medium`}>{category.score.toFixed(1)}/10</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="metric-label">All Categories Meeting Standards</span>
                        </h4>
                        <p className="text-xs metric-label">Great job! All categories are performing well.</p>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {categoriesWithIcons.map((category) => {
                const CategoryIcon = category.icon;
                const performanceLevel = getCategoryPerformanceLevel(category.score);
                
                return (
                  <div
                    key={category.key}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      performanceLevel.level === 'poor'
                        ? `${performanceLevel.bgColor} ${performanceLevel.borderColor} ring-1 ring-red-500/20`
                        : performanceLevel.level === 'medium'
                        ? `${performanceLevel.bgColor} ${performanceLevel.borderColor} ring-1 ring-yellow-500/20`
                        : `${performanceLevel.bgColor} ${performanceLevel.borderColor}`
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Performance indicator dot */}
                        <div className={`w-2 h-2 rounded-full ${performanceLevel.indicatorColor} ${
                          performanceLevel.level === 'poor' ? 'animate-pulse' : ''
                        }`} />
                        
                        <CategoryIcon className={`w-4 h-4 ${performanceLevel.color}`} />
                        <span className={`text-sm font-medium ${performanceLevel.color}`}>
                          {category.name}
                        </span>
                        
                        {/* Performance level badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${performanceLevel.bgColor} ${performanceLevel.color} border ${performanceLevel.borderColor}`}>
                          {performanceLevel.label}
                        </span>
                        
                        <span className="text-xs text-slate-400">({category.weight}%)</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${performanceLevel.color}`}>
                          {category.score.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({category.contribution.toFixed(1)})
                        </span>
                      </div>
                    </div>
                    
                    {/* Enhanced mini gauge for category with performance-based colors */}
                    <div className="w-full rounded-full h-2 mb-2 overflow-hidden" style={{ backgroundColor: '#202020' }}>
                      <div
                        className="h-full transition-all duration-500 relative rounded-full"
                        style={{
                          width: `${(category.score / 10) * 100}%`,
                          // Performance-based color coding with enhanced contrast
                          background: category.score >= 7.0
                            ? 'linear-gradient(90deg, #9333ea, #7c3aed)' // Meets Rules - purple
                            : category.score >= 5.0
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)' // Medium - yellow/amber
                            : 'linear-gradient(90deg, #ef4444, #dc2626)', // Doesn't Meet - red
                          boxShadow: performanceLevel.level === 'poor'
                            ? '0 0 12px rgba(239, 68, 68, 0.4)'
                            : performanceLevel.level === 'medium'
                            ? '0 0 8px rgba(245, 158, 11, 0.3)'
                            : '0 0 6px rgba(147, 51, 234, 0.2)'
                        }}
                      >
                        <div
                          className="absolute right-0 top-0 bottom-0 w-0.5"
                          style={{
                            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
                            boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Key metrics with enhanced styling for poor performance */}
                    <div className="flex flex-wrap gap-1">
                      {category.keyMetrics.map((metric, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                            performanceLevel.level === 'poor'
                              ? 'bg-red-500/10 text-red-300 border-red-500/30'
                              : performanceLevel.level === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                              : 'bg-green-500/10 text-green-300 border-green-500/30'
                          }`}
                        >
                          <Info className={`w-3 h-3 ${performanceLevel.color}`} />
                          {metric}
                        </span>
                      ))}
                    </div>
                    
                    {/* Attention indicator for poor performance */}
                    {performanceLevel.level === 'poor' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                        <span>Needs immediate attention</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Removed glass glow effect on hover */}
    </div>
  );
}
