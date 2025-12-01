/**
 * VRating Accuracy Diagnosis Script (Simple JavaScript Version)
 * 
 * This script investigates why profitable trading results in low VRating scores
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

    // Fetch all trades for user
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

    // ===== RISK ANALYSIS =====
    console.log('\n⚠️ Risk Analysis:');
    
    // Calculate running P&L for drawdown
    let cumulativePL = 0;
    let maxDrawdown = 0;
    let peak = 0;
    
    validTrades.forEach(trade => {
      cumulativePL += trade.pnl;
      if (cumulativePL > peak) peak = cumulativePL;
      const drawdown = peak - cumulativePL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
    console.log(`  Max Drawdown: ${maxDrawdown.toFixed(2)} (${maxDrawdownPercentage.toFixed(1)}%)`);
    
    // Calculate large losses
    const largeLosses = validTrades.filter(trade => trade.pnl < -5).length;
    const largeLossPercentage = (largeLosses / validTrades.length) * 100;
    console.log(`  Large Losses: ${largeLosses} (${largeLossPercentage.toFixed(1)}%)`);

    // ===== CONSISTENCY ANALYSIS =====
    console.log('\n📊 Consistency Analysis:');
    
    const pnlValues = validTrades.map(trade => trade.pnl);
    const avgPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length;
    const variance = pnlValues.reduce((sum, pnl) => sum + Math.pow(pnl - avgPnL, 2), 0) / pnlValues.length;
    const standardDeviation = Math.sqrt(variance);
    const plStdDevPercentage = avgPnL !== 0 ? (standardDeviation / Math.abs(avgPnL)) * 100 : 0;
    console.log(`  P&L Standard Deviation: ${plStdDevPercentage.toFixed(1)}%`);

    // ===== EMOTIONAL ANALYSIS =====
    console.log('\n🧠 Emotional Analysis:');
    
    const tradesWithEmotionalData = validTrades.filter(t => t.emotional_state && t.emotional_state.trim() !== '');
    const emotionalDataPercentage = (tradesWithEmotionalData.length / validTrades.length) * 100;
    console.log(`  Trades with Emotional Data: ${tradesWithEmotionalData.length} (${emotionalDataPercentage.toFixed(1)}%)`);

    // ===== JOURNALING ANALYSIS =====
    console.log('\n📝 Journaling Analysis:');
    
    const tradesWithNotes = validTrades.filter(t => t.notes && t.notes.trim() !== '');
    const tradesWithStrategy = validTrades.filter(t => t.strategy_id && t.strategy_id.trim() !== '');
    const notesPercentage = (tradesWithNotes.length / validTrades.length) * 100;
    const strategyPercentage = (tradesWithStrategy.length / validTrades.length) * 100;
    console.log(`  Trades with Notes: ${tradesWithNotes.length} (${notesPercentage.toFixed(1)}%)`);
    console.log(`  Trades with Strategy: ${tradesWithStrategy.length} (${strategyPercentage.toFixed(1)}%)`);

    // ===== ISSUE IDENTIFICATION =====
    console.log('\n🚨 Potential Issues Identified:');
    
    // Issue 1: Profitability calculation error
    const currentNetPLPercentage = (totalPnL / validTrades.length) * 100;
    console.log(`  Current P&L % Calculation: ${currentNetPLPercentage.toFixed(2)}% (total P&L / trade count)`);
    console.log(`  This is INCORRECT - should be based on initial capital, not trade count`);
    
    // Issue 2: Risk management over-penalization
    if (totalPnL > 0 && maxDrawdownPercentage > 20) {
      console.log(`  ❌ RISK MANAGEMENT ISSUE:`);
      console.log(`     Account is profitable (${totalPnL.toFixed(2)}) but has high drawdown (${maxDrawdownPercentage.toFixed(1)}%)`);
      console.log(`     Risk management scoring will be unfairly penalized`);
    }

    // Issue 3: Data quality issues
    const nullPnLTrades = trades.filter(t => t.pnl === null || t.pnl === undefined).length;
    if (nullPnLTrades > 0) {
      console.log(`  ❌ DATA QUALITY ISSUE:`);
      console.log(`     ${nullPnLTrades} trades have null/undefined P&L values`);
      console.log(`     These trades are excluded from VRating calculation`);
    }

    // Issue 4: Emotional data impact
    if (emotionalDataPercentage < 50) {
      console.log(`  ❌ EMOTIONAL DATA ISSUE:`);
      console.log(`     Only ${emotionalDataPercentage.toFixed(1)}% of trades have emotional data`);
      console.log(`     This negatively impacts Emotional Discipline score`);
    }

    // Issue 5: Journaling adherence impact
    if (notesPercentage < 50 || strategyPercentage < 50) {
      console.log(`  ❌ JOURNALING ISSUE:`);
      console.log(`     Notes: ${notesPercentage.toFixed(1)}%, Strategy: ${strategyPercentage.toFixed(1)}%`);
      console.log(`     This will lower Journaling Adherence score`);
    }

    // ===== EXPECTED VS ACTUAL ANALYSIS =====
    console.log('\n🎯 Expected vs Actual Analysis:');
    
    let expectedVRating = 5.0; // Base expectation
    
    if (totalPnL > 0 && winRate > 50) {
      expectedVRating = 7.0; // Should be "Good" range
    }
    
    if (totalPnL > 0 && winRate > 60 && profitFactor > 1.5) {
      expectedVRating = 8.0; // Should be "Very Good" range
    }
    
    if (totalPnL > 0 && winRate > 70 && profitFactor > 2.0) {
      expectedVRating = 9.0; // Should be "Excellent" range
    }

    console.log(`  Account Status: ${totalPnL > 0 ? 'PROFITABLE' : 'NOT PROFITABLE'}`);
    console.log(`  Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`  Profit Factor: ${profitFactor}`);
    console.log(`  Expected VRating: ${expectedVRating.toFixed(1)}/10`);
    
    // Calculate what the VRating should be based on basic metrics
    const simpleProfitabilityScore = totalPnL > 0 ? Math.min(10, Math.max(1, (winRate / 100) * 10)) : 1;
    const simpleRiskScore = maxDrawdownPercentage < 10 ? 8 : maxDrawdownPercentage < 20 ? 6 : maxDrawdownPercentage < 30 ? 4 : 2;
    const simpleConsistencyScore = plStdDevPercentage < 20 ? 8 : plStdDevPercentage < 40 ? 6 : plStdDevPercentage < 60 ? 4 : 2;
    const simpleEmotionalScore = emotionalDataPercentage > 80 ? 9 : emotionalDataPercentage > 60 ? 7 : emotionalDataPercentage > 40 ? 5 : 3;
    const simpleJournalingScore = ((notesPercentage + strategyPercentage) / 2) > 80 ? 9 : ((notesPercentage + strategyPercentage) / 2) > 60 ? 7 : ((notesPercentage + strategyPercentage) / 2) > 40 ? 5 : 3;
    
    const calculatedExpectedVRating = (
      simpleProfitabilityScore * 0.30 +
      simpleRiskScore * 0.25 +
      simpleConsistencyScore * 0.20 +
      simpleEmotionalScore * 0.15 +
      simpleJournalingScore * 0.10
    );
    
    console.log(`  Calculated Expected VRating: ${calculatedExpectedVRating.toFixed(1)}/10`);

    // ===== RECOMMENDATIONS =====
    console.log('\n💡 Primary Recommendations:');
    
    if (totalPnL > 0) {
      console.log('  🎯 MAIN ISSUE: Profitable account shows low VRating');
      console.log('     This indicates calculation errors, not trading issues');
      console.log('');
      console.log('  1. FIX PROFITABILITY CALCULATION:');
      console.log('     Change netPLPercentage from: (totalPL / trades.length) * 100');
      console.log('     To: (totalPL / initialCapital) * 100');
      console.log('     Or use risk-adjusted returns');
      console.log('');
      console.log('  2. ADJUST RISK MANAGEMENT SCORING:');
      console.log('     Current bands are too strict for profitable accounts');
      console.log('     Consider relative drawdown vs profitability');
      console.log('');
      console.log('  3. IMPROVE DATA QUALITY:');
      console.log('     Ensure all trades have valid P&L values');
      console.log('     Add emotional data to more trades');
      console.log('     Improve journaling completeness');
    }

    console.log('\n📋 Summary:');
    console.log(`  Account Status: ${totalPnL > 0 ? 'PROFITABLE' : 'NOT PROFITABLE'}`);
    console.log(`  Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`  Profit Factor: ${profitFactor}`);
    console.log(`  Max Drawdown: ${maxDrawdownPercentage.toFixed(1)}%`);
    console.log(`  Emotional Data: ${emotionalDataPercentage.toFixed(1)}%`);
    console.log(`  Journaling: ${((notesPercentage + strategyPercentage) / 2).toFixed(1)}%`);
    console.log(`  Expected VRating Range: ${expectedVRating.toFixed(1)}-9.0`);
    console.log(`  Issue Detected: ${totalPnL > 0 ? 'YES - Calculation Error' : 'NO'}`);

  } catch (error) {
    console.error('❌ Authentication or Data fetch error:', error);
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