/**
 * VRating Accuracy Diagnosis Script
 * 
 * This script investigates why profitable trading results in low VRating scores
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import VRating calculation functions
const { calculateVRating } = require('./src/lib/vrating-calculations.ts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnoseVRatingAccuracy() {
  console.log('🔍 Starting VRating Accuracy Diagnosis...\n');

  try {
    // Get test user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }

    console.log(`👤 Analyzing data for user: ${user.email} (ID: ${user.id})`);

    // Fetch all trades for the user
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching trades:', error);
      return;
    }

    if (!trades || trades.length === 0) {
      console.log('❌ No trades found for analysis');
      return;
    }

    console.log(`📊 Found ${trades.length} trades for analysis\n`);

    // ===== BASIC TRADING STATISTICS =====
    console.log('📈 Basic Trading Statistics:');
    
    const validTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined);
    const totalPnL = validTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winningTrades = validTrades.filter(t => t.pnl > 0).length;
    const losingTrades = validTrades.filter(t => t.pnl < 0).length;
    const winRate = validTrades.length > 0 ? (winningTrades / validTrades.length) * 100 : 0;
    
    console.log(`  Total Trades: ${trades.length}`);
    console.log(`  Valid Trades (with P&L): ${validTrades.length}`);
    console.log(`  Total P&L: ${totalPnL.toFixed(2)}`);
    console.log(`  Winning Trades: ${winningTrades}`);
    console.log(`  Losing Trades: ${losingTrades}`);
    console.log(`  Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`  Average P&L per trade: ${(totalPnL / validTrades.length).toFixed(2)}`);

    // ===== PROFITABILITY ANALYSIS =====
    console.log('\n💰 Profitability Analysis:');
    
    const grossProfit = validTrades.reduce((sum, t) => sum + Math.max(0, t.pnl), 0);
    const grossLoss = Math.abs(validTrades.reduce((sum, t) => sum + Math.min(0, t.pnl), 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 'Infinite' : '0') : (grossProfit / grossLoss).toFixed(2);
    
    console.log(`  Gross Profit: ${grossProfit.toFixed(2)}`);
    console.log(`  Gross Loss: ${grossLoss.toFixed(2)}`);
    console.log(`  Profit Factor: ${profitFactor}`);
    console.log(`  Is Profitable: ${totalPnL > 0 ? 'YES' : 'NO'}`);

    // ===== VRATING CALCULATION =====
    console.log('\n🎯 VRating Calculation Analysis:');
    
    try {
      // Convert trades to VRating format
      const vRatingTrades = validTrades.map(trade => ({
        ...trade,
        id: trade.id || `trade-${Math.random()}`,
        symbol: trade.symbol || 'UNKNOWN',
        side: trade.side || 'Buy',
        quantity: trade.quantity || 1,
        entry_price: trade.entry_price || 0,
        exit_price: trade.exit_price,
        pnl: trade.pnl || 0,
        trade_date: trade.trade_date || new Date().toISOString(),
        entry_time: trade.entry_time,
        exit_time: trade.exit_time,
        emotional_state: trade.emotional_state,
        strategy_id: trade.strategy_id,
        user_id: trade.user_id,
        notes: trade.notes,
        market: trade.market
      }));

      const vRatingResult = calculateVRating(vRatingTrades);
      
      console.log('  Overall VRating Score:', vRatingResult.overallRating.toFixed(2));
      console.log('  Category Scores:');
      console.log(`    Profitability: ${vRatingResult.categoryScores.profitability.toFixed(2)} (30% weight)`);
      console.log(`    Risk Management: ${vRatingResult.categoryScores.riskManagement.toFixed(2)} (25% weight)`);
      console.log(`    Consistency: ${vRatingResult.categoryScores.consistency.toFixed(2)} (20% weight)`);
      console.log(`    Emotional Discipline: ${vRatingResult.categoryScores.emotionalDiscipline.toFixed(2)} (15% weight)`);
      console.log(`    Journaling Adherence: ${vRatingResult.categoryScores.journalingAdherence.toFixed(2)} (10% weight)`);

      // ===== DETAILED METRICS ANALYSIS =====
      console.log('\n📊 Detailed Metrics Analysis:');
      const metrics = vRatingResult.metrics;
      
      console.log('  Profitability Metrics:');
      console.log(`    Net P&L %: ${metrics.profitability.netPLPercentage.toFixed(2)}%`);
      console.log(`    Win Rate: ${metrics.profitability.winRate.toFixed(1)}%`);
      console.log(`    Positive Months: ${metrics.profitability.positiveMonthsPercentage.toFixed(1)}%`);
      
      console.log('  Risk Management Metrics:');
      console.log(`    Max Drawdown %: ${metrics.riskManagement.maxDrawdownPercentage.toFixed(2)}%`);
      console.log(`    Large Loss %: ${metrics.riskManagement.largeLossPercentage.toFixed(1)}%`);
      console.log(`    Quantity Variability: ${metrics.riskManagement.quantityVariability.toFixed(1)}%`);
      console.log(`    Average Duration: ${metrics.riskManagement.averageTradeDuration.toFixed(1)} hours`);
      
      console.log('  Consistency Metrics:');
      console.log(`    P&L StdDev %: ${metrics.consistency.plStdDevPercentage.toFixed(2)}%`);
      console.log(`    Longest Loss Streak: ${metrics.consistency.longestLossStreak}`);
      console.log(`    Monthly Consistency: ${metrics.consistency.monthlyConsistencyRatio.toFixed(2)}`);

      // ===== ISSUE IDENTIFICATION =====
      console.log('\n🚨 Potential Issues Identified:');
      
      // Issue 1: Profitability calculation error
      const expectedNetPLPercentage = totalPnL > 0 ? ((totalPnL / 10000) * 100) : ((totalPnL / 10000) * 100); // Assuming 10k initial capital
      const actualNetPLPercentage = metrics.profitability.netPLPercentage;
      const profitabilityError = Math.abs(expectedNetPLPercentage - actualNetPLPercentage);
      
      if (profitabilityError > 50) {
        console.log(`  ❌ PROFITABILITY CALCULATION ERROR:`);
        console.log(`     Expected P&L % (assuming 10k capital): ${expectedNetPLPercentage.toFixed(2)}%`);
        console.log(`     Actual P&L %: ${actualNetPLPercentage.toFixed(2)}%`);
        console.log(`     Error: ${profitabilityError.toFixed(2)}%`);
        console.log(`     The calculation divides total P&L by trade count instead of initial capital`);
      }

      // Issue 2: Risk management over-penalization
      if (metrics.riskManagement.maxDrawdownPercentage > 20 && totalPnL > 0) {
        console.log(`  ❌ RISK MANAGEMENT OVER-PENALIZATION:`);
        console.log(`     Account is profitable (${totalPnL.toFixed(2)}) but has high drawdown (${metrics.riskManagement.maxDrawdownPercentage.toFixed(2)}%)`);
        console.log(`     Risk score: ${vRatingResult.categoryScores.riskManagement.toFixed(2)} (should be higher for profitable account)`);
      }

      // Issue 3: Data quality issues
      const nullPnLTrades = trades.filter(t => t.pnl === null || t.pnl === undefined).length;
      if (nullPnLTrades > 0) {
        console.log(`  ❌ DATA QUALITY ISSUE:`);
        console.log(`     ${nullPnLTrades} trades have null/undefined P&L values`);
        console.log(`     These trades are excluded from VRating calculation`);
      }

      // Issue 4: Emotional state parsing
      const tradesWithEmotionalData = validTrades.filter(t => t.emotional_state && t.emotional_state.trim() !== '').length;
      const emotionalDataPercentage = (tradesWithEmotionalData.length / validTrades.length) * 100;
      
      if (emotionalDataPercentage < 50) {
        console.log(`  ❌ EMOTIONAL DATA ISSUE:`);
        console.log(`     Only ${emotionalDataPercentage.toFixed(1)}% of trades have emotional data`);
        console.log(`     This negatively impacts Emotional Discipline score`);
      }

      // Issue 5: Scoring inconsistency
      const weightedScore = 
        vRatingResult.categoryScores.profitability * 0.30 +
        vRatingResult.categoryScores.riskManagement * 0.25 +
        vRatingResult.categoryScores.consistency * 0.20 +
        vRatingResult.categoryScores.emotionalDiscipline * 0.15 +
        vRatingResult.categoryScores.journalingAdherence * 0.10;
      
      const scoreDifference = Math.abs(weightedScore - vRatingResult.overallRating);
      if (scoreDifference > 0.1) {
        console.log(`  ❌ SCORING INCONSISTENCY:`);
        console.log(`     Calculated weighted score: ${weightedScore.toFixed(2)}`);
        console.log(`     Reported overall score: ${vRatingResult.overallRating.toFixed(2)}`);
        console.log(`     Difference: ${scoreDifference.toFixed(2)}`);
      }

      // ===== RECOMMENDATIONS =====
      console.log('\n💡 Recommendations:');
      
      if (totalPnL > 0 && vRatingResult.overallRating < 6.0) {
        console.log('  🎯 PRIMARY ISSUE: Profitable account has low VRating');
        console.log('     This indicates calculation errors, not trading issues');
        console.log('     Focus on fixing profitability calculation logic');
      }
      
      if (profitabilityError > 50) {
        console.log('  1. Fix net P&L percentage calculation in vrating-calculations.ts');
        console.log('     Change from: (totalPL / trades.length) * 100');
        console.log('     To: (totalPL / initialCapital) * 100');
      }
      
      if (metrics.riskManagement.maxDrawdownPercentage > 20 && totalPnL > 0) {
        console.log('  2. Adjust risk management scoring bands');
        console.log('     Current bands are too strict for profitable accounts');
        console.log('     Consider drawdown relative to profitability');
      }
      
      if (nullPnLTrades > 0) {
        console.log('  3. Fix data quality issues');
        console.log('     Ensure all trades have valid P&L values');
        console.log('     Add data validation in trade entry forms');
      }

      console.log('\n📋 Summary:');
      console.log(`  Account Status: ${totalPnL > 0 ? 'PROFITABLE' : 'NOT PROFITABLE'}`);
      console.log(`  VRating Score: ${vRatingResult.overallRating.toFixed(2)}/10`);
      console.log(`  Expected VRating: ${totalPnL > 0 ? '7.0-8.0' : '3.0-5.0'}`);
      console.log(`  Issue Detected: ${totalPnL > 0 && vRatingResult.overallRating < 6.0 ? 'YES' : 'NO'}`);

    } catch (error) {
      console.error('❌ Error in VRating calculation:', error);
    }

  } catch (error) {
    console.error('❌ Authentication or data fetch error:', error);
  }
}

// Run the diagnosis
diagnoseVRatingAccuracy().then(() => {
  console.log('\n✅ VRating Accuracy Diagnosis Complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});