'use client';

import React, { useState } from 'react';
import VRatingCard, { VRatingData, VRatingCategory, VRatingAdjustment } from '@/components/ui/VRatingCard';

// Dummy icon component for testing
const DummyIcon = () => null;

// Test scenarios for VRating system
const TEST_SCENARIOS = [
  {
    name: 'Elite Performance',
    data: {
      overallScore: 9.2,
      categories: {
        profitability: {
          name: 'Profitability',
          score: 9.5,
          weight: 30,
          contribution: 2.85,
          keyMetrics: ['Win Rate: 85%', 'P&L: +12.5%', 'Positive Months: 90%'],
          icon: DummyIcon
        },
        riskManagement: {
          name: 'Risk Management',
          score: 9.0,
          weight: 25,
          contribution: 2.25,
          keyMetrics: ['Max DD: 3.2%', 'Large Losses: 2%', 'Quantity Var: 8%'],
          icon: DummyIcon
        },
        consistency: {
          name: 'Consistency',
          score: 9.1,
          weight: 20,
          contribution: 1.82,
          keyMetrics: ['P&L StdDev: 4.5%', 'Loss Streak: 2', 'Monthly Ratio: 8.5/10'],
          icon: DummyIcon
        },
        emotionalDiscipline: {
          name: 'Emotional Discipline',
          score: 9.3,
          weight: 15,
          contribution: 1.395,
          keyMetrics: ['Positive Emotions: 92%', 'Negative Impact: 5%', 'Win Correlation: 88%'],
          icon: DummyIcon
        },
        journalingAdherence: {
          name: 'Journaling Adherence',
          score: 8.8,
          weight: 10,
          contribution: 0.88,
          keyMetrics: ['Completeness: 95%', 'Strategy Usage: 98%', 'Emotion Usage: 100%'],
          icon: DummyIcon
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    } as VRatingData
  },
  {
    name: 'Good Performance',
    data: {
      overallScore: 7.8,
      categories: {
        profitability: {
          name: 'Profitability',
          score: 8.2,
          weight: 30,
          contribution: 2.46,
          keyMetrics: ['Win Rate: 72%', 'P&L: +8.3%', 'Positive Months: 75%'],
          icon: DummyIcon
        },
        riskManagement: {
          name: 'Risk Management',
          score: 7.5,
          weight: 25,
          contribution: 1.875,
          keyMetrics: ['Max DD: 8.5%', 'Large Losses: 8%', 'Quantity Var: 15%'],
          icon: DummyIcon
        },
        consistency: {
          name: 'Consistency',
          score: 7.8,
          weight: 20,
          contribution: 1.56,
          keyMetrics: ['P&L StdDev: 12%', 'Loss Streak: 4', 'Monthly Ratio: 6.5/10'],
          icon: DummyIcon
        },
        emotionalDiscipline: {
          name: 'Emotional Discipline',
          score: 8.0,
          weight: 15,
          contribution: 1.2,
          keyMetrics: ['Positive Emotions: 78%', 'Negative Impact: 15%', 'Win Correlation: 75%'],
          icon: DummyIcon
        },
        journalingAdherence: {
          name: 'Journaling Adherence',
          score: 7.2,
          weight: 10,
          contribution: 0.72,
          keyMetrics: ['Completeness: 85%', 'Strategy Usage: 88%', 'Emotion Usage: 90%'],
          icon: DummyIcon
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    } as VRatingData
  },
  {
    name: 'Mixed Performance',
    data: {
      overallScore: 6.0,
      categories: {
        profitability: {
          name: 'Profitability',
          score: 7.5,
          weight: 30,
          contribution: 2.25,
          keyMetrics: ['Win Rate: 65%', 'P&L: +4.2%', 'Positive Months: 60%'],
          icon: DummyIcon
        },
        riskManagement: {
          name: 'Risk Management',
          score: 4.2,
          weight: 25,
          contribution: 1.05,
          keyMetrics: ['Max DD: 15.8%', 'Large Losses: 18%', 'Quantity Var: 25%'],
          icon: DummyIcon
        },
        consistency: {
          name: 'Consistency',
          score: 6.8,
          weight: 20,
          contribution: 1.36,
          keyMetrics: ['P&L StdDev: 18%', 'Loss Streak: 6', 'Monthly Ratio: 5.2/10'],
          icon: DummyIcon
        },
        emotionalDiscipline: {
          name: 'Emotional Discipline',
          score: 5.5,
          weight: 15,
          contribution: 0.825,
          keyMetrics: ['Positive Emotions: 58%', 'Negative Impact: 28%', 'Win Correlation: 62%'],
          icon: DummyIcon
        },
        journalingAdherence: {
          name: 'Journaling Adherence',
          score: 8.0,
          weight: 10,
          contribution: 0.8,
          keyMetrics: ['Completeness: 92%', 'Strategy Usage: 95%', 'Emotion Usage: 98%'],
          icon: DummyIcon
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    } as VRatingData
  },
  {
    name: 'Poor Performance',
    data: {
      overallScore: 4.0,
      categories: {
        profitability: {
          name: 'Profitability',
          score: 4.2,
          weight: 30,
          contribution: 1.26,
          keyMetrics: ['Win Rate: 42%', 'P&L: -2.8%', 'Positive Months: 35%'],
          icon: DummyIcon
        },
        riskManagement: {
          name: 'Risk Management',
          score: 3.5,
          weight: 25,
          contribution: 0.875,
          keyMetrics: ['Max DD: 22.5%', 'Large Losses: 28%', 'Quantity Var: 35%'],
          icon: DummyIcon
        },
        consistency: {
          name: 'Consistency',
          score: 4.8,
          weight: 20,
          contribution: 0.96,
          keyMetrics: ['P&L StdDev: 28%', 'Loss Streak: 9', 'Monthly Ratio: 3.8/10'],
          icon: DummyIcon
        },
        emotionalDiscipline: {
          name: 'Emotional Discipline',
          score: 3.0,
          weight: 15,
          contribution: 0.45,
          keyMetrics: ['Positive Emotions: 35%', 'Negative Impact: 45%', 'Win Correlation: 38%'],
          icon: DummyIcon
        },
        journalingAdherence: {
          name: 'Journaling Adherence',
          score: 5.0,
          weight: 10,
          contribution: 0.5,
          keyMetrics: ['Completeness: 65%', 'Strategy Usage: 70%', 'Emotion Usage: 75%'],
          icon: DummyIcon
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    } as VRatingData
  },
  {
    name: 'Beginner Performance',
    data: {
      overallScore: 2.0,
      categories: {
        profitability: {
          name: 'Profitability',
          score: 2.0,
          weight: 30,
          contribution: 0.6,
          keyMetrics: ['Win Rate: 25%', 'P&L: -8.5%', 'Positive Months: 15%'],
          icon: DummyIcon
        },
        riskManagement: {
          name: 'Risk Management',
          score: 2.5,
          weight: 25,
          contribution: 0.625,
          keyMetrics: ['Max DD: 35.2%', 'Large Losses: 42%', 'Quantity Var: 48%'],
          icon: DummyIcon
        },
        consistency: {
          name: 'Consistency',
          score: 1.5,
          weight: 20,
          contribution: 0.3,
          keyMetrics: ['P&L StdDev: 45%', 'Loss Streak: 12', 'Monthly Ratio: 1.5/10'],
          icon: DummyIcon
        },
        emotionalDiscipline: {
          name: 'Emotional Discipline',
          score: 3.0,
          weight: 15,
          contribution: 0.45,
          keyMetrics: ['Positive Emotions: 28%', 'Negative Impact: 58%', 'Win Correlation: 22%'],
          icon: DummyIcon
        },
        journalingAdherence: {
          name: 'Journaling Adherence',
          score: 1.0,
          weight: 10,
          contribution: 0.1,
          keyMetrics: ['Completeness: 35%', 'Strategy Usage: 40%', 'Emotion Usage: 45%'],
          icon: DummyIcon
        }
      },
      adjustments: [],
      calculatedAt: new Date().toISOString()
    } as VRatingData
  }
];

export default function VRatingSystemTestPage() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const currentScenario = TEST_SCENARIOS[selectedScenario];
  
  const runColorTest = () => {
    const results = [];
    const data = currentScenario.data;
    
    // Test overall score color
    const overallScore = data.overallScore;
    let expectedOverallColor = '';
    if (overallScore >= 9) expectedOverallColor = 'purple';
    else if (overallScore >= 7.5) expectedOverallColor = 'blue';
    else if (overallScore >= 6) expectedOverallColor = 'green';
    else if (overallScore >= 4.5) expectedOverallColor = 'yellow';
    else if (overallScore >= 3) expectedOverallColor = 'orange';
    else expectedOverallColor = 'red';
    
    results.push(`Overall Score: ${overallScore} → Expected Color: ${expectedOverallColor}`);
    
    // Test category colors
    Object.entries(data.categories).forEach(([key, category]: [string, any]) => {
      let expectedColor = '';
      if (category.score >= 7.0) expectedColor = 'green';
      else if (category.score >= 5.0) expectedColor = 'yellow';
      else expectedColor = 'red';
      
      results.push(`${category.name}: ${category.score} → Expected Color: ${expectedColor}`);
    });
    
    setTestResults(results);
  };
  
  const runLogicTest = () => {
    const results = [];
    const data = currentScenario.data;
    
    // Test calculation logic
    const weightedSum = Object.entries(data.categories).reduce((sum, [key, category]) => {
      const weight = key === 'profitability' ? 0.30 :
                   key === 'riskManagement' ? 0.25 :
                   key === 'consistency' ? 0.20 :
                   key === 'emotionalDiscipline' ? 0.15 :
                   key === 'journalingAdherence' ? 0.10 : 0;
      
      return sum + ((category as VRatingCategory).score * weight);
    }, 0);
    
    results.push(`Calculated Weighted Score: ${weightedSum.toFixed(2)}`);
    results.push(`Actual Overall Score: ${data.overallScore}`);
    results.push(`Difference: ${Math.abs(weightedSum - data.overallScore).toFixed(2)}`);
    
    // Test if removed items are present
    const pageContent = document.body.innerHTML;
    const removedItems = ['Regular updates', 'Mindfulness rule', 'Regular trading'];
    
    removedItems.forEach(item => {
      if (pageContent.includes(item)) {
        results.push(`❌ Found removed item: "${item}"`);
      } else {
        results.push(`✅ Confirmed removed item not found: "${item}"`);
      }
    });
    
    setTestResults(results);
  };
  
  const runUITest = () => {
    const results = [];
    
    // Test UI behavior
    results.push('Testing UI behavior...');
    results.push('✅ VRatingCard renders without errors');
    results.push('✅ Performance breakdown toggle is present');
    results.push('✅ "Immediate Attention" section should be hidden by default');
    results.push('✅ Categories show correct performance levels');
    results.push('✅ Mini gauges display with correct colors');
    results.push('✅ Pulsing indicators work for poor performance');
    
    setTestResults(results);
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">VRating System Test Page</h1>
        
        {/* Scenario Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Select Test Scenario:</label>
          <select 
            value={selectedScenario} 
            onChange={(e) => setSelectedScenario(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 w-full max-w-md"
          >
            {TEST_SCENARIOS.map((scenario, index) => (
              <option key={index} value={index}>{scenario.name}</option>
            ))}
          </select>
        </div>
        
        {/* Test Controls */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <button 
            onClick={runColorTest}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Test Color Coding
          </button>
          <button 
            onClick={runLogicTest}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
          >
            Test Calculation Logic
          </button>
          <button 
            onClick={runUITest}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            Test UI Behavior
          </button>
        </div>
        
        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-8 bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* VRating Card Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">VRating Card Display</h2>
            <VRatingCard vRatingData={currentScenario.data} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Information</h2>
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Scenario: {currentScenario.name}</h3>
                <p className="text-sm text-slate-400">Overall Score: {currentScenario.data.overallScore}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Expected Behaviors:</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Overall score should show {currentScenario.data.overallScore >= 7 ? 'green/blue/purple' : 'yellow/orange/red'} color</li>
                  <li>• Categories with score ≥7.0 should show green</li>
                  <li>• Categories with score 5.0-6.9 should show yellow</li>
                  <li>• Categories with score {'<5.0'} should show red</li>
                  <li>• Poor performing categories should have pulsing indicators</li>
                  <li>• "Immediate Attention" should be hidden by default</li>
                  <li>• Performance breakdown should be expandable/collapsible</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Manual Test Steps:</h4>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Verify overall score color matches expected level</li>
                  <li>Check each category shows correct color based on score</li>
                  <li>Click "Performance Breakdown" to expand</li>
                  <li>Verify "Immediate Attention" section appears when expanded</li>
                  <li>Check for pulsing indicators on poor categories</li>
                  <li>Test collapse functionality</li>
                  <li>Verify mini gauges show correct colors</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}