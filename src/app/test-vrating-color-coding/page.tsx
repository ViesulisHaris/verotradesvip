'use client';

import React, { useState } from 'react';
import VRatingCard from '@/components/ui/VRatingCard';

// Test data with different performance levels
const testCases = [
  {
    name: "Poor Performance - Multiple Issues",
    data: {
      overallScore: 3.2,
      categories: {
        profitability: {
          name: "Profitability",
          score: 2.8,
          weight: 30,
          contribution: 0.84,
          keyMetrics: ["Win Rate", "P&L", "Profit Factor"],
          icon: () => null
        },
        riskManagement: {
          name: "Risk Management",
          score: 4.1,
          weight: 25,
          contribution: 1.025,
          keyMetrics: ["Max Drawdown", "Position Size", "Stop Loss"],
          icon: () => null
        },
        consistency: {
          name: "Consistency",
          score: 3.5,
          weight: 20,
          contribution: 0.7,
          keyMetrics: ["Win Streak", "Loss Streak", "Monthly P&L"],
          icon: () => null
        },
        emotionalDiscipline: {
          name: "Emotional Discipline",
          score: 4.8,
          weight: 15,
          contribution: 0.72,
          keyMetrics: ["Positive Emotions", "Emotional Control", "Mindfulness"],
          icon: () => null
        },
        journalingAdherence: {
          name: "Journaling Adherence",
          score: 6.2,
          weight: 10,
          contribution: 0.62,
          keyMetrics: ["Trade Notes", "Strategy Usage", "Emotional Logging"],
          icon: () => null
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    }
  },
  {
    name: "Mixed Performance - Some Issues",
    data: {
      overallScore: 6.1,
      categories: {
        profitability: {
          name: "Profitability",
          score: 7.8,
          weight: 30,
          contribution: 2.34,
          keyMetrics: ["Win Rate", "P&L", "Profit Factor"],
          icon: () => null
        },
        riskManagement: {
          name: "Risk Management",
          score: 5.5,
          weight: 25,
          contribution: 1.375,
          keyMetrics: ["Max Drawdown", "Position Size", "Stop Loss"],
          icon: () => null
        },
        consistency: {
          name: "Consistency",
          score: 4.2,
          weight: 20,
          contribution: 0.84,
          keyMetrics: ["Win Streak", "Loss Streak", "Monthly P&L"],
          icon: () => null
        },
        emotionalDiscipline: {
          name: "Emotional Discipline",
          score: 6.8,
          weight: 15,
          contribution: 1.02,
          keyMetrics: ["Positive Emotions", "Emotional Control", "Mindfulness"],
          icon: () => null
        },
        journalingAdherence: {
          name: "Journaling Adherence",
          score: 8.1,
          weight: 10,
          contribution: 0.81,
          keyMetrics: ["Trade Notes", "Strategy Usage", "Emotional Logging"],
          icon: () => null
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    }
  },
  {
    name: "Good Performance - All Meeting Standards",
    data: {
      overallScore: 8.4,
      categories: {
        profitability: {
          name: "Profitability",
          score: 8.5,
          weight: 30,
          contribution: 2.55,
          keyMetrics: ["Win Rate", "P&L", "Profit Factor"],
          icon: () => null
        },
        riskManagement: {
          name: "Risk Management",
          score: 8.2,
          weight: 25,
          contribution: 2.05,
          keyMetrics: ["Max Drawdown", "Position Size", "Stop Loss"],
          icon: () => null
        },
        consistency: {
          name: "Consistency",
          score: 7.9,
          weight: 20,
          contribution: 1.58,
          keyMetrics: ["Win Streak", "Loss Streak", "Monthly P&L"],
          icon: () => null
        },
        emotionalDiscipline: {
          name: "Emotional Discipline",
          score: 8.8,
          weight: 15,
          contribution: 1.32,
          keyMetrics: ["Positive Emotions", "Emotional Control", "Mindfulness"],
          icon: () => null
        },
        journalingAdherence: {
          name: "Journaling Adherence",
          score: 9.1,
          weight: 10,
          contribution: 0.91,
          keyMetrics: ["Trade Notes", "Strategy Usage", "Emotional Logging"],
          icon: () => null
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    }
  }
];

export default function TestVRatingColorCoding() {
  const [selectedTest, setSelectedTest] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VRating Color Coding Test
          </h1>
          <p className="text-slate-300 mb-6">
            Test the new color coding system for VRating categories to highlight areas that need improvement.
          </p>
          
          {/* Test case selector */}
          <div className="flex gap-4 mb-8">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => setSelectedTest(index)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedTest === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {testCase.name}
              </button>
            ))}
          </div>
        </div>

        {/* VRating Card with selected test case */}
        <div className="mb-12">
          <VRatingCard vRatingData={testCases[selectedTest].data} />
        </div>

        {/* Color coding reference */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Color Coding Reference</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium">Meets Rules (7.0-10.0)</span>
              </div>
              <p className="text-green-300 text-sm">
                Category is performing well and meets established standards. No immediate action needed.
              </p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-400 font-medium">Medium (5.0-6.9)</span>
              </div>
              <p className="text-yellow-300 text-sm">
                Category has room for improvement. Consider focusing on this area for better performance.
              </p>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">{`Doesn't Meet (<5.0)`}</span>
              </div>
              <p className="text-red-300 text-sm">
                Category needs immediate attention and significant improvement to meet standards.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-lg font-medium mb-2 text-white">Key Features</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Immediate attention indicator appears at the top of the card for poor/medium performing categories</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Color-coded borders and backgrounds for categories in the expanded view</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Performance level badges (Meets Rules/Medium/Doesn't Meet) for each category</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Pulsing indicators for categories that need immediate attention</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Enhanced contrast against slate backgrounds for better visibility</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}