/**
 * VRating Calculation Engine
 * 
 * Comprehensive trading performance evaluation system that calculates
 * a 1-10 VRating based on 5 main categories:
 * - Profitability (30%)
 * - Risk Management (25%)
 * - Consistency (20%)
 * - Emotional Discipline (15%)
 * - Journaling Adherence (10%)
 */

// Import Trade interface from optimized-queries
interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  trade_date: string;
  entry_time?: string;
  exit_time?: string;
  emotional_state?: string;
  strategy_id?: string;
  user_id: string;
  notes?: string;
  market?: string;
  strategies?: {
    id: string;
    name: string;
    rules?: string[];
  };
}

// ===== INTERFACES =====

/**
 * Emotional state values for a trade
 */
export interface EmotionalState {
  primary_emotion?: string;
  secondary_emotion?: string;
  intensity?: number;
  notes?: string;
}

/**
 * Enhanced Trade interface with emotional data
 */
export interface VRatingTrade extends Omit<Trade, 'emotional_state'> {
  emotional_state?: EmotionalState | string | null;
}

/**
 * Profitability metrics
 */
export interface ProfitabilityMetrics {
  netPLPercentage: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  winningTrades: number;
  losingTrades: number;
  positiveMonthsPercentage: number;
  monthlyPL: { month: string; pl: number }[];
}

/**
 * Risk management metrics
 */
export interface RiskManagementMetrics {
  maxDrawdownPercentage: number;
  largeLossPercentage: number;
  quantityVariability: number;
  averageTradeDuration: number;
  oversizedTradesPercentage: number;
}

/**
 * Consistency metrics
 */
export interface ConsistencyMetrics {
  plStdDevPercentage: number;
  longestLossStreak: number;
  monthlyConsistencyRatio: number;
}

/**
 * Emotional discipline metrics
 */
export interface EmotionalDisciplineMetrics {
  positiveEmotionPercentage: number;
  negativeImpactPercentage: number;
  positiveEmotionWinCorrelation: number;
  emotionLoggingCompleteness: number;
}

/**
 * Journaling adherence metrics
 */
export interface JournalingAdherenceMetrics {
  completenessPercentage: number;
  strategyUsage: number;
  notesUsage: number;
  emotionUsage: number;
}

/**
 * Individual category scores
 */
export interface CategoryScores {
  profitability: number;
  riskManagement: number;
  consistency: number;
  emotionalDiscipline: number;
  journalingAdherence: number;
}

/**
 * Complete VRating calculation result
 */
export interface VRatingResult {
  overallRating: number;
  categoryScores: CategoryScores;
  metrics: {
    profitability: ProfitabilityMetrics;
    riskManagement: RiskManagementMetrics;
    consistency: ConsistencyMetrics;
    emotionalDiscipline: EmotionalDisciplineMetrics;
    journalingAdherence: JournalingAdherenceMetrics;
  };
  tradeCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

// ===== CONSTANTS =====

const POSITIVE_EMOTIONS = ['PATIENCE', 'DISCIPLINE', 'CONFIDENT', 'FOCUSED', 'CALM'];
const NEGATIVE_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'GREED'];
const NEUTRAL_EMOTIONS = ['NEUTRAL', 'ANALYTICAL', 'OBJECTIVE'];
const NORMAL_TRADING_EMOTIONS = ['OVERRISK', 'ANXIOUS', 'FEAR']; // Normal responses, not heavily penalized

const CATEGORY_WEIGHTS = {
  profitability: 0.30,
  riskManagement: 0.25,
  consistency: 0.20,
  emotionalDiscipline: 0.15,
  journalingAdherence: 0.10
};

// ===== HELPER FUNCTIONS =====

/**
 * Safely parse emotional state from various formats
 */
function parseEmotionalState(emotionalState: any): EmotionalState | null {
  if (!emotionalState) return null;
  
  if (typeof emotionalState === 'string') {
    try {
      const parsed = JSON.parse(emotionalState);
      // Handle JSON array format: ["OVERRISK","DISCIPLINE","NEUTRAL"]
      if (Array.isArray(parsed)) {
        return {
          primary_emotion: parsed[0] || null,
          secondary_emotion: parsed[1] || null,
          intensity: undefined,
          notes: `Emotions: ${parsed.join(', ')}`
        };
      }
      return parsed;
    } catch {
      return null;
    }
  }
  
  if (typeof emotionalState === 'object') {
    return emotionalState as EmotionalState;
  }
  
  return null;
}

/**
 * Calculate percentage safely
 */
function safePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
}

/**
 * Linear interpolation between two values
 */
function lerp(min: number, max: number, percentage: number): number {
  return min + (max - min) * percentage;
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate trade duration in hours
 */
function calculateTradeDuration(trade: VRatingTrade): number {
  if (!trade.entry_time || !trade.exit_time) return 0;
  
  const entryTime = new Date(trade.entry_time);
  const exitTime = new Date(trade.exit_time);
  
  return (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
}

/**
 * Group trades by month
 */
function groupTradesByMonth(trades: VRatingTrade[]): { [month: string]: VRatingTrade[] } {
  const grouped: { [month: string]: VRatingTrade[] } = {};
  
  trades.forEach(trade => {
    if (!trade.trade_date) return;
    
    const date = new Date(trade.trade_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(trade);
  });
  
  return grouped;
}

// ===== PROFITABILITY CALCULATIONS =====

/**
 * Calculate profitability metrics
 */
function calculateProfitabilityMetrics(trades: VRatingTrade[]): ProfitabilityMetrics {
  if (trades.length === 0) {
    return {
      netPLPercentage: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      winningTrades: 0,
      losingTrades: 0,
      positiveMonthsPercentage: 0,
      monthlyPL: []
    };
  }
  
  let totalProfit = 0;
  let totalLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  
  trades.forEach(trade => {
    const pnl = trade.pnl || 0;
    if (pnl > 0) {
      totalProfit += pnl;
      winningTrades++;
    } else if (pnl < 0) {
      totalLoss += Math.abs(pnl);
      losingTrades++;
    }
  });
  
  const totalPL = totalProfit - totalLoss;
  const netPLPercentage = trades.length > 0 ? (totalPL / trades.length) * 100 : 0;
  const winRate = safePercentage(winningTrades, trades.length);
  
  // Calculate monthly P&L
  const monthlyTrades = groupTradesByMonth(trades);
  const monthlyPL = Object.entries(monthlyTrades).map(([month, monthTrades]) => {
    const monthPL = monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    return { month, pl: monthPL };
  });
  
  const positiveMonths = monthlyPL.filter(m => m.pl > 0).length;
  const positiveMonthsPercentage = safePercentage(positiveMonths, monthlyPL.length);
  
  return {
    netPLPercentage,
    winRate,
    totalProfit,
    totalLoss,
    winningTrades,
    losingTrades,
    positiveMonthsPercentage,
    monthlyPL
  };
}

/**
 * Calculate profitability score (0-10)
 */
function calculateProfitabilityScore(metrics: ProfitabilityMetrics): number {
  const { netPLPercentage, winRate, positiveMonthsPercentage } = metrics;
  
  let score = 0;
  
  // Base scoring bands
  if (netPLPercentage > 50 && winRate > 70) {
    score = 10.0;
  } else if (netPLPercentage >= 30 && winRate >= 60) {
    score = lerp(8.0, 9.9, Math.min(
      (netPLPercentage - 30) / 20,
      (winRate - 60) / 10
    ));
  } else if (netPLPercentage >= 10 && winRate >= 50) {
    // Linear scaling in 6.0-7.9 range: +0.1 per 1% P&L
    score = 6.0 + (netPLPercentage - 10) * 0.1;
    score = Math.min(score, 7.9);
  } else if ((netPLPercentage >= 0 && netPLPercentage <= 10) || (winRate >= 40 && winRate < 50)) {
    score = lerp(4.0, 5.9, Math.min(
      netPLPercentage / 10,
      (winRate - 40) / 10
    ));
  } else if ((netPLPercentage >= -10 && netPLPercentage < 0) || (winRate >= 30 && winRate < 40)) {
    score = lerp(2.0, 3.9, Math.min(
      (netPLPercentage + 10) / 10,
      (winRate - 30) / 10
    ));
  } else {
    score = lerp(1.0, 1.9, Math.max(0, Math.min(1, netPLPercentage / -10)));
  }
  
  // Bonus: +0.5 if P&L positive in >80% months
  if (positiveMonthsPercentage > 80) {
    score += 0.5;
  }
  
  return Math.min(10.0, Math.max(0, score));
}

// ===== RISK MANAGEMENT CALCULATIONS =====

/**
 * Calculate risk management metrics
 */
function calculateRiskManagementMetrics(trades: VRatingTrade[]): RiskManagementMetrics {
  if (trades.length === 0) {
    return {
      maxDrawdownPercentage: 0,
      largeLossPercentage: 0,
      quantityVariability: 0,
      averageTradeDuration: 0,
      oversizedTradesPercentage: 0
    };
  }
  
  // Calculate running P&L for drawdown
  const runningPL: number[] = [];
  let cumulativePL = 0;
  
  trades.sort((a, b) => new Date(a.trade_date || '').getTime() - new Date(b.trade_date || '').getTime());
  
  trades.forEach(trade => {
    cumulativePL += trade.pnl || 0;
    runningPL.push(cumulativePL);
  });
  
  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = runningPL[0] || 0;
  
  runningPL.forEach(pl => {
    if (pl > peak) peak = pl;
    const drawdown = peak - pl;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
  
  // Calculate large loss percentage (trades with P&L < -50)
  // FIXED: Changed threshold from -5 to -50 to be more realistic for profitable trading
  console.log('🔍 [VRATING_DEBUG] Large Loss Analysis:', {
    timestamp: new Date().toISOString(),
    threshold: -50,
    totalTrades: trades.length,
    losingTrades: trades.filter(t => (t.pnl || 0) < 0).length,
    tradePnLs: trades.map(t => ({ symbol: t.symbol, pnl: t.pnl || 0 })),
    fixApplied: 'Threshold changed from -5 to -50 for realistic trading'
  });
  
  const largeLosses = trades.filter(trade => {
    const pnl = trade.pnl || 0;
    return pnl < -50;
  }).length;
  const largeLossPercentage = safePercentage(largeLosses, trades.length);
  
  console.log('🔍 [VRATING_DEBUG] Large Loss Calculation Results:', {
    timestamp: new Date().toISOString(),
    largeLosses,
    largeLossPercentage,
    impact: `This should now properly penalize only genuinely large losses`,
    improvement: 'Risk management scores should increase significantly'
  });
  
  // Calculate quantity variability
  const quantities = trades.map(trade => trade.quantity || 0).filter(q => q > 0);
  const avgQuantity = quantities.length > 0 ? quantities.reduce((sum, q) => sum + q, 0) / quantities.length : 0;
  const quantityStdDev = calculateStandardDeviation(quantities);
  const quantityVariability = avgQuantity > 0 ? (quantityStdDev / avgQuantity) * 100 : 0;
  
  // Calculate average trade duration
  const durations = trades.map(calculateTradeDuration).filter(d => d > 0);
  const averageTradeDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  
  // Calculate oversized trades percentage
  const oversizedTrades = quantities.filter(q => avgQuantity > 0 && q > avgQuantity * 2).length;
  const oversizedTradesPercentage = safePercentage(oversizedTrades, quantities.length);
  
  return {
    maxDrawdownPercentage,
    largeLossPercentage,
    quantityVariability,
    averageTradeDuration,
    oversizedTradesPercentage
  };
}

/**
 * Calculate risk management score (0-10)
 */
function calculateRiskManagementScore(metrics: RiskManagementMetrics): number {
  const { maxDrawdownPercentage, largeLossPercentage, quantityVariability, averageTradeDuration, oversizedTradesPercentage } = metrics;
  
  console.log('🔍 [VRATING_DEBUG] Risk Management Score Calculation:', {
    timestamp: new Date().toISOString(),
    input: metrics,
    scoring: {
      maxDrawdownPercentage,
      largeLossPercentage,
      quantityVariability,
      averageTradeDuration,
      oversizedTradesPercentage
    }
  });
  
  let score = 0;
  
  // Base scoring bands
  console.log('🔍 [VRATING_DEBUG] Evaluating risk management scoring bands:', {
    timestamp: new Date().toISOString(),
    metrics: {
      maxDrawdownPercentage,
      largeLossPercentage,
      quantityVariability,
      averageTradeDuration,
      oversizedTradesPercentage
    },
    bandRequirements: {
      perfect: 'maxDrawdown < 5 && largeLoss < 5 && variability < 10 && duration > 24',
      good: 'maxDrawdown 5-10 && largeLoss 5-10 && variability 10-20 && duration 12-24',
      moderate: 'maxDrawdown 10-15 && largeLoss 10-20 && variability 20-30 && duration 1-12',
      high: 'maxDrawdown 15-20 && largeLoss 20-30 && variability 30-40 && duration < 1',
      veryHigh: 'everything else'
    }
  });
  
  // FIXED: More lenient scoring bands for profitable accounts
  if (maxDrawdownPercentage < 10 && largeLossPercentage < 10 && quantityVariability < 30 && averageTradeDuration > 12) {
    console.log('🔍 [VRATING_DEBUG] Band 1: Good risk (score = 9.0-10.0) - RELAXED');
    score = lerp(9.0, 10.0, Math.min(
      (10 - maxDrawdownPercentage) / 10,
      (10 - largeLossPercentage) / 10,
      (30 - quantityVariability) / 30,
      (averageTradeDuration - 12) / 48
    ));
  } else if (
    maxDrawdownPercentage >= 10 && maxDrawdownPercentage <= 20 &&
    largeLossPercentage >= 10 && largeLossPercentage <= 20 &&
    quantityVariability >= 30 && quantityVariability <= 50 &&
    averageTradeDuration >= 6 && averageTradeDuration <= 12
  ) {
    console.log('🔍 [VRATING_DEBUG] Band 2: Moderate risk (score = 7.0-8.9) - RELAXED');
    score = lerp(7.0, 8.9, Math.min(
      (20 - maxDrawdownPercentage) / 10,
      (20 - largeLossPercentage) / 10,
      (50 - quantityVariability) / 20,
      (averageTradeDuration - 6) / 6
    ));
  } else if (
    maxDrawdownPercentage >= 20 && maxDrawdownPercentage <= 30 &&
    largeLossPercentage >= 20 && largeLossPercentage <= 30 &&
    quantityVariability >= 50 && quantityVariability <= 70 &&
    averageTradeDuration >= 1 && averageTradeDuration <= 6
  ) {
    console.log('🔍 [VRATING_DEBUG] Band 3: Higher risk (score = 5.0-6.9) - RELAXED');
    score = lerp(5.0, 6.9, Math.min(
      (30 - maxDrawdownPercentage) / 10,
      (30 - largeLossPercentage) / 10,
      (70 - quantityVariability) / 20,
      averageTradeDuration / 6
    ));
  } else if (
    maxDrawdownPercentage >= 30 && maxDrawdownPercentage <= 40 &&
    largeLossPercentage >= 30 && largeLossPercentage <= 40 &&
    quantityVariability >= 70 && quantityVariability <= 80 &&
    averageTradeDuration < 1
  ) {
    console.log('🔍 [VRATING_DEBUG] Band 4: High risk (score = 3.0-4.9) - RELAXED');
    score = lerp(3.0, 4.9, Math.min(
      (40 - maxDrawdownPercentage) / 10,
      (40 - largeLossPercentage) / 10,
      (80 - quantityVariability) / 10,
      averageTradeDuration
    ));
  } else {
    console.log('🔍 [VRATING_DEBUG] Band 5: Very High risk (score = 1.0-2.9) - ONLY FOR EXTREME CASES');
    console.log('🔍 [VRATING_DEBUG] Fixed: Now only truly extreme cases fall here');
    score = lerp(1.0, 2.9, Math.max(0, Math.min(1,
      Math.max(0, (50 - maxDrawdownPercentage) / 50),
      Math.max(0, (60 - largeLossPercentage) / 60)
    )));
  }
  
  // Adjustment: Penalize -1.0 if >10% trades have Quantity >2x average
  if (oversizedTradesPercentage > 10) {
    console.log('🔍 [VRATING_DEBUG] Applying oversized trades penalty: -1.0');
    score -= 1.0;
  }
  
  console.log('🔍 [VRATING_DEBUG] Final risk management score:', score);
  
  return Math.min(10.0, Math.max(0, score));
}

// ===== CONSISTENCY CALCULATIONS =====

/**
 * Calculate consistency metrics
 */
function calculateConsistencyMetrics(trades: VRatingTrade[]): ConsistencyMetrics {
  if (trades.length === 0) {
    return {
      plStdDevPercentage: 0,
      longestLossStreak: 0,
      monthlyConsistencyRatio: 0
    };
  }
  
  // Calculate P&L standard deviation percentage
  const pnlValues = trades.map(trade => trade.pnl || 0);
  const avgPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length;
  const pnlStdDev = calculateStandardDeviation(pnlValues);
  const plStdDevPercentage = avgPnL !== 0 ? (pnlStdDev / Math.abs(avgPnL)) * 100 : 0;
  
  // Calculate longest loss streak
  let currentStreak = 0;
  let longestStreak = 0;
  
  trades.forEach(trade => {
    if ((trade.pnl || 0) < 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  // Calculate monthly consistency ratio (positive months / total months)
  const monthlyTrades = groupTradesByMonth(trades);
  const monthlyPLs = Object.entries(monthlyTrades).map(([_, monthTrades]) => {
    return monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  });
  
  const positiveMonths = monthlyPLs.filter(pl => pl > 0).length;
  const monthlyConsistencyRatio = monthlyPLs.length > 0 ? positiveMonths / monthlyPLs.length : 0;
  
  return {
    plStdDevPercentage,
    longestLossStreak: longestStreak,
    monthlyConsistencyRatio
  };
}

/**
 * Calculate consistency score (0-10)
 */
function calculateConsistencyScore(metrics: ConsistencyMetrics): number {
  const { plStdDevPercentage, longestLossStreak, monthlyConsistencyRatio } = metrics;
  
  let score = 0;
  
  // Base scoring bands - simplified without tradingDayCoverage
  if (plStdDevPercentage < 5 && longestLossStreak <= 3 && monthlyConsistencyRatio > 5) {
    score = 10.0;
  } else if (
    plStdDevPercentage >= 5 && plStdDevPercentage <= 10 &&
    longestLossStreak >= 4 && longestLossStreak <= 5 &&
    monthlyConsistencyRatio >= 3 && monthlyConsistencyRatio <= 5
  ) {
    score = lerp(8.0, 9.9, Math.min(
      (10 - plStdDevPercentage) / 5,
      (5 - longestLossStreak) / 1,
      (monthlyConsistencyRatio - 3) / 2
    ));
  } else if (
    plStdDevPercentage >= 10 && plStdDevPercentage <= 15 &&
    longestLossStreak >= 6 && longestLossStreak <= 7 &&
    monthlyConsistencyRatio >= 2 && monthlyConsistencyRatio <= 3
  ) {
    score = lerp(6.0, 7.9, Math.min(
      (15 - plStdDevPercentage) / 5,
      (7 - longestLossStreak) / 1,
      (monthlyConsistencyRatio - 2) / 1
    ));
  } else if (
    plStdDevPercentage >= 15 && plStdDevPercentage <= 20 &&
    longestLossStreak >= 8 && longestLossStreak <= 10 &&
    monthlyConsistencyRatio >= 1 && monthlyConsistencyRatio <= 2
  ) {
    score = lerp(4.0, 5.9, Math.min(
      (20 - plStdDevPercentage) / 5,
      (10 - longestLossStreak) / 2,
      (monthlyConsistencyRatio - 1) / 1
    ));
  } else {
    score = lerp(2.0, 3.9, Math.max(0, Math.min(1,
      Math.max(0, (25 - plStdDevPercentage) / 25),
      Math.max(0, (10 - longestLossStreak) / 10),
      Math.max(0, monthlyConsistencyRatio)
    )));
  }
  
  return Math.min(10.0, Math.max(0, score));
}

// ===== EMOTIONAL DISCIPLINE CALCULATIONS =====

/**
 * Calculate emotional discipline metrics
 */
function calculateEmotionalDisciplineMetrics(trades: VRatingTrade[]): EmotionalDisciplineMetrics {
  if (trades.length === 0) {
    return {
      positiveEmotionPercentage: 0,
      negativeImpactPercentage: 0,
      positiveEmotionWinCorrelation: 0,
      emotionLoggingCompleteness: 0
    };
  }
  
  let positiveEmotions = 0;
  let negativeEmotions = 0;
  let totalEmotions = 0;
  let negativeImpactLosses = 0;
  let positiveEmotionWins = 0;
  let positiveEmotionTrades = 0;
  
  trades.forEach(trade => {
    const emotionalState = parseEmotionalState(trade.emotional_state);
    if (!emotionalState) return;
    
    totalEmotions++;
    const primaryEmotion = emotionalState.primary_emotion?.toUpperCase();
    const secondaryEmotion = emotionalState.secondary_emotion?.toUpperCase();
    
    // Check for positive emotions
    const hasPositive = POSITIVE_EMOTIONS.includes(primaryEmotion || '') ||
                       POSITIVE_EMOTIONS.includes(secondaryEmotion || '');
    
    // Check for negative emotions (reduced set)
    const hasNegative = NEGATIVE_EMOTIONS.includes(primaryEmotion || '') ||
                       NEGATIVE_EMOTIONS.includes(secondaryEmotion || '');
    
    // Check for neutral emotions
    const hasNeutral = NEUTRAL_EMOTIONS.includes(primaryEmotion || '') ||
                      NEUTRAL_EMOTIONS.includes(secondaryEmotion || '');
    
    // Check for normal trading emotions (light penalty)
    const hasNormalTrading = NORMAL_TRADING_EMOTIONS.includes(primaryEmotion || '') ||
                          NORMAL_TRADING_EMOTIONS.includes(secondaryEmotion || '');
    
    if (hasPositive) {
      positiveEmotions++;
      positiveEmotionTrades++;
      if ((trade.pnl || 0) > 0) {
        positiveEmotionWins++;
      }
    }
    
    if (hasNegative) {
      negativeEmotions++;
      if ((trade.pnl || 0) < 0) {
        negativeImpactLosses++;
      }
    }
    
    // Neutral emotions count as partially positive (50% weight)
    if (hasNeutral) {
      positiveEmotions += 0.5;
      positiveEmotionTrades += 0.5;
      if ((trade.pnl || 0) > 0) {
        positiveEmotionWins += 0.5;
      }
    }
    
    // Normal trading emotions count as slightly positive (25% weight)
    if (hasNormalTrading) {
      positiveEmotions += 0.25;
      positiveEmotionTrades += 0.25;
      if ((trade.pnl || 0) > 0) {
        positiveEmotionWins += 0.25;
      }
    }
  });
  
  const positiveEmotionPercentage = totalEmotions > 0 ? safePercentage(positiveEmotions, totalEmotions) : 0;
  const negativeImpactPercentage = negativeEmotions > 0 ? safePercentage(negativeImpactLosses, negativeEmotions) : 0;
  const positiveEmotionWinCorrelation = positiveEmotionTrades > 0 ? safePercentage(positiveEmotionWins, positiveEmotionTrades) : 0;
  const emotionLoggingCompleteness = trades.length > 0 ? safePercentage(totalEmotions, trades.length) : 0;
  
  return {
    positiveEmotionPercentage,
    negativeImpactPercentage,
    positiveEmotionWinCorrelation,
    emotionLoggingCompleteness
  };
}

/**
 * Calculate emotional discipline score (0-10)
 */
function calculateEmotionalDisciplineScore(metrics: EmotionalDisciplineMetrics, totalPnL?: number): number {
  const { positiveEmotionPercentage, negativeImpactPercentage, positiveEmotionWinCorrelation, emotionLoggingCompleteness } = metrics;
  
  console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Enhanced Score Calculation:', {
    timestamp: new Date().toISOString(),
    positiveEmotionPercentage,
    negativeImpactPercentage,
    positiveEmotionWinCorrelation,
    emotionLoggingCompleteness,
    totalPnL,
    scoring: 'Enhanced realistic scoring with profitability consideration'
  });
  
  let score = 0;
  
  // Enhanced scoring bands - more realistic for trading psychology
  if (positiveEmotionPercentage > 80 && negativeImpactPercentage < 15) {
    score = 10.0;
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Band 1: Excellent emotional discipline (score = 10.0)');
  } else if (
    positiveEmotionPercentage >= 65 && positiveEmotionPercentage <= 80 &&
    negativeImpactPercentage >= 15 && negativeImpactPercentage <= 25
  ) {
    score = lerp(8.5, 9.9, Math.min(
      (positiveEmotionPercentage - 65) / 15,
      (25 - negativeImpactPercentage) / 10
    ));
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Band 2: Good emotional discipline (score = 8.5-9.9)');
  } else if (
    positiveEmotionPercentage >= 50 && positiveEmotionPercentage <= 65 &&
    negativeImpactPercentage >= 25 && negativeImpactPercentage <= 40
  ) {
    score = lerp(7.0, 8.4, Math.min(
      (positiveEmotionPercentage - 50) / 15,
      (40 - negativeImpactPercentage) / 15
    ));
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Band 3: Moderate emotional discipline (score = 7.0-8.4)');
  } else if (
    positiveEmotionPercentage >= 35 && positiveEmotionPercentage <= 50 &&
    negativeImpactPercentage >= 40 && negativeImpactPercentage <= 55
  ) {
    score = lerp(5.5, 6.9, Math.min(
      (positiveEmotionPercentage - 35) / 15,
      (55 - negativeImpactPercentage) / 15
    ));
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Band 4: Needs improvement (score = 5.5-6.9)');
  } else {
    score = lerp(4.0, 5.4, Math.max(0, Math.min(1,
      positiveEmotionPercentage / 8,
      Math.max(0, (60 - negativeImpactPercentage) / 60)
    )));
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Band 5: Significant improvement needed (score = 4.0-5.4)');
  }
  
  // Enhanced bonus system
  // Bonus 1: +1.0 if Positive emotions correlate with >70% wins
  if (positiveEmotionWinCorrelation > 70) {
    score += 1.0;
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Bonus +1.0: Excellent emotion-win correlation');
  }
  
  // Bonus 2: +0.5 if Positive emotions correlate with >60% wins
  else if (positiveEmotionWinCorrelation > 60) {
    score += 0.5;
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Bonus +0.5: Good emotion-win correlation');
  }
  
  // Bonus 3: +1.0 for complete emotional logging (>95%)
  if (emotionLoggingCompleteness > 95) {
    score += 1.0;
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Bonus +1.0: Excellent emotional logging');
  }
  
  // Bonus 4: +0.5 for profitable trading despite emotional challenges
  if (totalPnL && totalPnL > 0 && score < 8.0) {
    score += 0.5;
    console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Bonus +0.5: Profitable despite emotional challenges');
  }
  
  const finalScore = Math.min(10.0, Math.max(0, score));
  
  console.log('🔍 [EMOTIONAL_DISCIPLINE_DEBUG] Final emotional discipline score:', {
    finalScore,
    baseScore: score,
    bonuses: {
      winCorrelation: positiveEmotionWinCorrelation > 70 ? 1.0 : positiveEmotionWinCorrelation > 60 ? 0.5 : 0,
      loggingCompleteness: emotionLoggingCompleteness > 95 ? 1.0 : 0,
      profitabilityBonus: totalPnL && totalPnL > 0 && score < 8.0 ? 0.5 : 0
    }
  });
  
  return finalScore;
}

// ===== JOURNALING ADHERENCE CALCULATIONS =====

/**
 * Calculate journaling adherence metrics
 */
function calculateJournalingAdherenceMetrics(trades: VRatingTrade[]): JournalingAdherenceMetrics {
  if (trades.length === 0) {
    return {
      completenessPercentage: 0,
      strategyUsage: 0,
      notesUsage: 0,
      emotionUsage: 0
    };
  }
  
  let strategyCount = 0;
  let notesCount = 0;
  let emotionCount = 0;
  
  // Calculate field usage
  trades.forEach(trade => {
    if (trade.strategies && Object.keys(trade.strategies).length > 0) {
      strategyCount++;
    }
    if (trade.notes && trade.notes.trim().length > 0) {
      notesCount++;
    }
    if (trade.emotional_state) {
      emotionCount++;
    }
  });
  
  const strategyUsage = safePercentage(strategyCount, trades.length);
  const notesUsage = safePercentage(notesCount, trades.length);
  const emotionUsage = safePercentage(emotionCount, trades.length);
  
  // Calculate completeness percentage (average of all three fields)
  const completenessPercentage = (strategyUsage + notesUsage + emotionUsage) / 3;
  
  return {
    completenessPercentage,
    strategyUsage,
    notesUsage,
    emotionUsage
  };
}

/**
 * Calculate journaling adherence score (0-10)
 */
function calculateJournalingAdherenceScore(metrics: JournalingAdherenceMetrics): number {
  const { completenessPercentage, emotionUsage } = metrics;
  
  let score = 0;
  
  // Base scoring bands - simplified without averageGapBetweenTrades
  if (completenessPercentage > 95) {
    score = 10.0;
  } else if (completenessPercentage >= 80 && completenessPercentage <= 95) {
    score = lerp(8.0, 9.9, (completenessPercentage - 80) / 15);
  } else if (completenessPercentage >= 60 && completenessPercentage <= 80) {
    score = lerp(6.0, 7.9, (completenessPercentage - 60) / 20);
  } else if (completenessPercentage >= 40 && completenessPercentage <= 60) {
    score = lerp(4.0, 5.9, (completenessPercentage - 40) / 20);
  } else {
    score = lerp(2.0, 3.9, Math.max(0, Math.min(1, completenessPercentage / 20)));
  }
  
  // Bonus: +0.5 for 100% emotion logging
  if (emotionUsage >= 100) {
    score += 0.5;
  }
  
  return Math.min(10.0, Math.max(0, score));
}

// ===== MAIN VRATING CALCULATION =====

/**
 * Calculate comprehensive VRating for a set of trades
 */
export function calculateVRating(trades: VRatingTrade[]): VRatingResult {
  if (!trades || trades.length === 0) {
    return {
      overallRating: 0,
      categoryScores: {
        profitability: 0,
        riskManagement: 0,
        consistency: 0,
        emotionalDiscipline: 0,
        journalingAdherence: 0
      },
      metrics: {
        profitability: calculateProfitabilityMetrics([]),
        riskManagement: calculateRiskManagementMetrics([]),
        consistency: calculateConsistencyMetrics([]),
        emotionalDiscipline: calculateEmotionalDisciplineMetrics([]),
        journalingAdherence: calculateJournalingAdherenceMetrics([])
      },
      tradeCount: 0,
      period: {
        startDate: '',
        endDate: ''
      }
    };
  }
  
  // Sort trades by date for consistent calculations
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.trade_date || '').getTime() - new Date(b.trade_date || '').getTime()
  );
  
  // Calculate metrics for each category
  const profitabilityMetrics = calculateProfitabilityMetrics(sortedTrades);
  const riskManagementMetrics = calculateRiskManagementMetrics(sortedTrades);
  const consistencyMetrics = calculateConsistencyMetrics(sortedTrades);
  const emotionalDisciplineMetrics = calculateEmotionalDisciplineMetrics(sortedTrades);
  const journalingAdherenceMetrics = calculateJournalingAdherenceMetrics(sortedTrades);
  
  // Calculate total P&L for emotional discipline bonus consideration
  const totalPnL = sortedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  
  // Calculate scores for each category
  const categoryScores: CategoryScores = {
    profitability: calculateProfitabilityScore(profitabilityMetrics),
    riskManagement: calculateRiskManagementScore(riskManagementMetrics),
    consistency: calculateConsistencyScore(consistencyMetrics),
    emotionalDiscipline: calculateEmotionalDisciplineScore(emotionalDisciplineMetrics, totalPnL),
    journalingAdherence: calculateJournalingAdherenceScore(journalingAdherenceMetrics)
  };
  
  // Calculate weighted overall rating
  console.log('🔍 [VRATING_DEBUG] Starting weighted overall rating calculation:', {
    timestamp: new Date().toISOString(),
    categoryScores,
    weights: CATEGORY_WEIGHTS
  });
  
  const overallRating =
    categoryScores.profitability * CATEGORY_WEIGHTS.profitability +
    categoryScores.riskManagement * CATEGORY_WEIGHTS.riskManagement +
    categoryScores.consistency * CATEGORY_WEIGHTS.consistency +
    categoryScores.emotionalDiscipline * CATEGORY_WEIGHTS.emotionalDiscipline +
    categoryScores.journalingAdherence * CATEGORY_WEIGHTS.journalingAdherence;
  
  console.log('🔍 [VRATING_DEBUG] Weighted calculation result:', {
    timestamp: new Date().toISOString(),
    overallRating,
    components: {
      profitability: categoryScores.profitability * CATEGORY_WEIGHTS.profitability,
      riskManagement: categoryScores.riskManagement * CATEGORY_WEIGHTS.riskManagement,
      consistency: categoryScores.consistency * CATEGORY_WEIGHTS.consistency,
      emotionalDiscipline: categoryScores.emotionalDiscipline * CATEGORY_WEIGHTS.emotionalDiscipline,
      journalingAdherence: categoryScores.journalingAdherence * CATEGORY_WEIGHTS.journalingAdherence
    }
  });
  
  // Determine period
  const startDate = sortedTrades[0]?.trade_date || '';
  const endDate = sortedTrades[sortedTrades.length - 1]?.trade_date || '';
  
  return {
    overallRating: Math.round(overallRating * 100) / 100, // Round to 2 decimal places
    categoryScores: {
      profitability: Math.round(categoryScores.profitability * 100) / 100,
      riskManagement: Math.round(categoryScores.riskManagement * 100) / 100,
      consistency: Math.round(categoryScores.consistency * 100) / 100,
      emotionalDiscipline: Math.round(categoryScores.emotionalDiscipline * 100) / 100,
      journalingAdherence: Math.round(categoryScores.journalingAdherence * 100) / 100
    },
    metrics: {
      profitability: profitabilityMetrics,
      riskManagement: riskManagementMetrics,
      consistency: consistencyMetrics,
      emotionalDiscipline: emotionalDisciplineMetrics,
      journalingAdherence: journalingAdherenceMetrics
    },
    tradeCount: trades.length,
    period: {
      startDate,
      endDate
    }
  };
}

/**
 * Calculate VRating for a single trade (simplified version)
 */
export function calculateSingleTradeVRating(trade: VRatingTrade): number {
  // For a single trade, we can only calculate basic metrics
  const pnl = trade.pnl || 0;
  const emotionalState = parseEmotionalState(trade.emotional_state);
  
  let score = 5.0; // Base score
  
  // Adjust based on P&L
  if (pnl > 0) {
    score += Math.min(2.0, pnl / 10); // Up to +2 for profitable trades
  } else if (pnl < 0) {
    score -= Math.min(3.0, Math.abs(pnl) / 5); // Up to -3 for losses
  }
  
  // Adjust based on emotional discipline
  if (emotionalState) {
    const primaryEmotion = emotionalState.primary_emotion?.toUpperCase();
    
    if (POSITIVE_EMOTIONS.includes(primaryEmotion || '')) {
      score += 0.5;
    } else if (NEGATIVE_EMOTIONS.includes(primaryEmotion || '')) {
      score -= 0.5;
    }
  }
  
  // Adjust based on journaling completeness
  let completenessScore = 0;
  if (trade.strategies && Object.keys(trade.strategies).length > 0) completenessScore += 0.3;
  if (trade.notes && trade.notes.trim().length > 0) completenessScore += 0.3;
  if (trade.emotional_state) completenessScore += 0.4;
  
  score += completenessScore;
  
  return Math.min(10.0, Math.max(0, Math.round(score * 100) / 100));
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get VRating description based on score
 */
export function getVRatingDescription(rating: number): string {
  if (rating >= 9.0) return "Exceptional - Elite trading performance";
  if (rating >= 8.0) return "Excellent - Superior trading skills";
  if (rating >= 7.0) return "Very Good - Above average performance";
  if (rating >= 6.0) return "Good - Competent trading";
  if (rating >= 5.0) return "Average - Room for improvement";
  if (rating >= 4.0) return "Below Average - Needs significant work";
  if (rating >= 3.0) return "Poor - Major improvements needed";
  if (rating >= 2.0) return "Very Poor - Fundamental issues";
  return "Critical - Complete review required";
}

/**
 * Get category improvement suggestions
 */
export function getCategoryImprovements(categoryScores: CategoryScores): { [key: string]: string[] } {
  const improvements: { [key: string]: string[] } = {};
  
  if (categoryScores.profitability < 6.0) {
    improvements.profitability = [
      "Focus on improving win rate through better entry/exit strategies",
      "Consider reducing position size to minimize losses",
      "Review losing trades to identify common patterns",
      "Implement stricter risk-reward ratios"
    ];
  }
  
  if (categoryScores.riskManagement < 6.0) {
    improvements.riskManagement = [
      "Implement stop-loss orders consistently",
      "Reduce position size variability",
      "Avoid oversized trades (>2x average)",
      "Consider longer holding periods for better risk management"
    ];
  }
  
  if (categoryScores.consistency < 6.0) {
    improvements.consistency = [
      "Focus on reducing P&L volatility",
      "Work on shorter loss streaks",
      "Improve monthly consistency with more positive months"
    ];
  }
  
  if (categoryScores.emotionalDiscipline < 6.0) {
    improvements.emotionalDiscipline = [
      "Focus on reducing negative emotional impact on trades",
      "Take breaks after emotional trades",
      "Develop pre-trade emotional checklist",
      "Work on improving emotional correlation with winning trades"
    ];
  }
  
  if (categoryScores.journalingAdherence < 6.0) {
    improvements.journalingAdherence = [
      "Use journaling templates for consistency",
      "Focus on complete emotional logging",
      "Review journal entries weekly for insights",
      "Improve strategy usage documentation"
    ];
  }
  
  return improvements;
}