// Manual verification script for chart background transparency
// This script analyzes the chart components to verify they have transparent backgrounds

const fs = require('fs');
const path = require('path');

function analyzeChartComponent(filePath, componentName) {
  console.log(`🔍 Analyzing ${componentName}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const analysis = {
      componentName,
      filePath,
      hasTransparentBackground: false,
      backgroundStyle: null,
      issues: [],
      status: 'PASS',
      findings: []
    };

    // Check for transparent background settings
    const transparentPatterns = [
      /background:\s*['"`]?\s*transparent/gi,
      /background:\s*['"`]?\s*rgba\s*\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/gi,
      /background:\s*['"`]?\s*rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.\d+)?\s*\)/gi,
      /style=\{\{\s*background:\s*transparent/gi,
      /style=\{\{\s*background:\s*rgba/gi
    ];

    // Check for solid/opaque background patterns (these are bad)
    const opaquePatterns = [
      /background:\s*['"`]?\s*#[0-9a-f]{3,6}/gi,
      /background:\s*['"`]?\s*rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi,
      /background:\s*['"`]?\s*rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[1-9]\s*\)/gi,
      /backgroundColor:\s*['"`]?\s*#[0-9a-f]{3,6}/gi,
      /backgroundColor:\s*['"`]?\s*rgb/gi,
      /backgroundColor:\s*['"`]?\s*rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[1-9]\s*\)/gi
    ];

    // Check for gradient backgrounds (these might be okay if they have transparency)
    const gradientPatterns = [
      /background:\s*['"`]?\s*linear-gradient/gi,
      /background:\s*['"`]?\s*radial-gradient/gi,
      /fill=\s*['"`]?\s*url\(#.*gradient/gi
    ];

    // Check for explicit transparent background style
    const hasTransparent = transparentPatterns.some(pattern => pattern.test(content));
    const hasOpaque = opaquePatterns.some(pattern => pattern.test(content));
    const hasGradient = gradientPatterns.some(pattern => pattern.test(content));

    // Determine background style
    if (hasTransparent) {
      analysis.hasTransparentBackground = true;
      analysis.backgroundStyle = 'transparent';
      analysis.findings.push('✅ Found transparent background setting');
    } else if (hasOpaque) {
      analysis.hasTransparentBackground = false;
      analysis.backgroundStyle = 'opaque';
      analysis.status = 'FAIL';
      analysis.issues.push('❌ Found opaque/solid background that blocks Balatro background');
      analysis.findings.push('❌ Background should be transparent to show Balatro effect');
    } else if (hasGradient) {
      analysis.hasTransparentBackground = true;
      analysis.backgroundStyle = 'gradient';
      analysis.findings.push('✅ Found gradient background (should have transparency)');
      
      // Check if gradient has transparency
      const hasTransparencyInGradient = /rgba\s*\([^)]*0\.\d+[^)]*\)/gi.test(content) ||
                                            /rgba\s*\([^)]*\s*0\s*\)/gi.test(content);
      
      if (hasTransparencyInGradient) {
        analysis.findings.push('✅ Gradient includes transparency');
      } else {
        analysis.findings.push('⚠️  Gradient found but transparency not confirmed');
        analysis.status = 'WARNING';
        analysis.issues.push('⚠️  Gradient should include transparency for better Balatro integration');
      }
    } else {
      analysis.status = 'WARNING';
      analysis.issues.push('⚠️  Background style not clearly identified');
      analysis.findings.push('⚠️  Background style unclear - manual review needed');
    }

    // Check for specific CSS classes that should have transparency
    const transparentClasses = [
      'chart-container-enhanced',
      'glass-enhanced',
      'chart-container'
    ];

    const hasTransparentClass = transparentClasses.some(className => 
      content.includes(`className="${className}"`) || 
      content.includes(`className='${className}'`) ||
      content.includes(`className={\`${className}\``) ||
      content.includes(`${className}`)
    );

    if (hasTransparentClass) {
      analysis.findings.push(`✅ Uses transparent CSS class: ${transparentClasses.find(c => content.includes(c))}`);
    }

    // Check for inline style transparency
    const inlineTransparentStyle = /style=\{\{\s*background:\s*transparent/gi.test(content);
    if (inlineTransparentStyle) {
      analysis.findings.push('✅ Uses inline transparent background style');
    }

    // Check for specific component patterns that indicate proper transparency
    const transparencyIndicators = [
      'background: \'transparent\'',
      'background: "transparent"',
      'background: transparent',
      'backgroundColor: \'transparent\'',
      'backgroundColor: "transparent"',
      'backgroundColor: transparent',
      'rgba(0, 0, 0, 0)',
      'rgba(15, 23, 42, 0)',
      'rgba(30, 41, 59, 0)'
    ];

    const hasTransparencyIndicator = transparencyIndicators.some(indicator => 
      content.includes(indicator)
    );

    if (hasTransparencyIndicator) {
      analysis.findings.push('✅ Contains explicit transparency indicator');
    }

    return analysis;
  } catch (error) {
    return {
      componentName,
      filePath,
      hasTransparentBackground: false,
      backgroundStyle: null,
      issues: [`❌ Error analyzing file: ${error.message}`],
      status: 'ERROR',
      findings: [`❌ Failed to analyze: ${error.message}`]
    };
  }
}

function checkBalatroIntegration() {
  console.log('🌊 Checking Balatro background integration...');
  
  const layoutPath = './src/app/layout.tsx';
  const globalsPath = './src/app/globals.css';
  
  const integration = {
    balatroInLayout: false,
    transparentBody: false,
    issues: [],
    status: 'PASS',
    findings: []
  };

  try {
    // Check layout.tsx for Balatro component
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    if (layoutContent.includes('<Balatro') || layoutContent.includes('Balatro')) {
      integration.balatroInLayout = true;
      integration.findings.push('✅ Balatro component included in layout');
    } else {
      integration.issues.push('❌ Balatro component not found in layout');
      integration.status = 'FAIL';
    }

    // Check globals.css for transparent body
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    if (globalsContent.includes('background: transparent') || 
        globalsContent.includes('background-image: none')) {
      integration.transparentBody = true;
      integration.findings.push('✅ Body background set to transparent');
    } else {
      integration.issues.push('❌ Body background not set to transparent');
      integration.status = integration.status === 'FAIL' ? 'FAIL' : 'WARNING';
    }

    // Check for glass-enhanced class definition
    if (globalsContent.includes('.glass-enhanced') && 
        globalsContent.includes('background: transparent')) {
      integration.findings.push('✅ Glass-enhanced styles with transparent background');
    }

  } catch (error) {
    integration.issues.push(`❌ Error checking integration: ${error.message}`);
    integration.status = 'ERROR';
  }

  return integration;
}

function generateReport(analyses, balatroIntegration) {
  const timestamp = new Date().toLocaleString();
  const totalCharts = analyses.length;
  const passedCharts = analyses.filter(a => a.status === 'PASS').length;
  const failedCharts = analyses.filter(a => a.status === 'FAIL').length;
  const warningCharts = analyses.filter(a => a.status === 'WARNING').length;
  const errorCharts = analyses.filter(a => a.status === 'ERROR').length;

  let overallStatus = 'PASS';
  if (failedCharts > 0 || balatroIntegration.status === 'FAIL') {
    overallStatus = 'FAIL';
  } else if (warningCharts > 0 || balatroIntegration.status === 'WARNING') {
    overallStatus = 'WARNING';
  }

  return `# Chart Background Transparency Verification Report

**Verification Date:** ${timestamp}
**Overall Status:** ${overallStatus}

## Executive Summary

- **Total Chart Components Analyzed:** ${totalCharts}
- **Passed:** ${passedCharts}
- **Failed:** ${failedCharts}
- **Warnings:** ${warningCharts}
- **Errors:** ${errorCharts}
- **Balatro Integration:** ${balatroIntegration.status === 'PASS' ? '✅ PASS' : balatroIntegration.status === 'FAIL' ? '❌ FAIL' : '⚠️  WARNING'}

## Overall Assessment

${overallStatus === 'PASS' ? 
  '✅ **SUCCESS:** All chart components have been properly configured with transparent backgrounds and should integrate seamlessly with the Balatro background.' :
  overallStatus === 'FAIL' ?
  '❌ **FAILURE:** Chart transparency issues were detected that will prevent proper integration with the Balatro background.' :
  '⚠️  **WARNING:** Chart components have transparent backgrounds but there are some concerns that may affect visual integration.'
}

## Balatro Background Integration Analysis

${balatroIntegration.findings.map(finding => `- ${finding}`).join('\n')}

${balatroIntegration.issues.length > 0 ? `
**Integration Issues:**
${balatroIntegration.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Detailed Chart Component Analysis

${analyses.map(analysis => `
### ${analysis.componentName}

**File:** \`${analysis.filePath}\`
**Status:** ${analysis.status}
**Background Style:** ${analysis.backgroundStyle || 'Not detected'}
**Transparent Background:** ${analysis.hasTransparentBackground ? '✅ YES' : '❌ NO'}

**Findings:**
${analysis.findings.map(finding => `- ${finding}`).join('\n')}

${analysis.issues.length > 0 ? `
**Issues:**
${analysis.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}
---
`).join('\n')}

## Recommendations

${overallStatus === 'PASS' ? 
  `🎉 **Excellent!** All chart components are properly configured for transparency.

**Implementation Status:**
- ✅ Chart components have transparent backgrounds
- ✅ Balatro background integration is properly configured
- ✅ Visual consistency should be maintained across the dashboard

**Next Steps:**
- No immediate action required
- Monitor visual appearance in production
- Consider performance optimization if needed` :
  overallStatus === 'FAIL' ?
  `🔧 **Action Required:** Chart transparency issues need to be addressed.

**Priority Actions:**
${analyses.filter(a => a.status === 'FAIL').map(a => `
- **${a.componentName}:** Fix background transparency
  ${a.issues.map(i => `  - ${i}`).join('\n')}
`).join('')}

**Implementation Steps:**
1. Review components with failed status
2. Update CSS to use transparent backgrounds
3. Remove solid color backgrounds that block Balatro
4. Test visual integration after changes
5. Verify seamless blending with animated background` :
  `⚠️ **Minor Issues Detected:** Chart components have transparent backgrounds but need review.

**Recommended Actions:**
${analyses.filter(a => a.status === 'WARNING').map(a => `
- **${a.componentName}:** Review and optimize
  ${a.issues.map(i => `  - ${i}`).join('\n')}
`).join('')}

**Implementation Steps:**
1. Review components with warnings
2. Optimize for better visual integration
3. Consider enhancing transparency effects
4. Test with different Balatro background states
5. Verify consistency across screen sizes`}

## Technical Analysis Summary

**Chart Components with Transparent Backgrounds:**
${analyses.filter(a => a.hasTransparentBackground).map(a => `- ${a.componentName}`).join('\n') || 'None'}

**Chart Components Requiring Attention:**
${analyses.filter(a => a.status !== 'PASS').map(a => `
- **${a.componentName}** (${a.status}): ${a.issues.join(', ')}
`).join('\n') || 'None'}

**Transparency Implementation Methods:**
- CSS transparent backgrounds
- RGBA colors with alpha transparency
- Glass morphism effects
- Gradient overlays with transparency

## Conclusion

${overallStatus === 'PASS' ? 
  '✅ **VERIFICATION SUCCESSFUL:** The chart background transparency implementation has been successfully verified. All components are properly configured to integrate seamlessly with the Balatro animated background, providing a consistent and visually appealing user experience.' :
  overallStatus === 'FAIL' ?
  '❌ **VERIFICATION FAILED:** Chart transparency issues were identified that will prevent proper integration with the Balatro background. Immediate action is required to address the identified issues and ensure seamless visual integration.' :
  '⚠️  **VERIFICATION COMPLETE WITH CONCERNS:** Chart components have transparent backgrounds but there are recommendations for optimization. The implementation should work with the Balatro background, but minor improvements may enhance the visual experience.'
}

---
*Report generated by Chart Background Transparency Verification Tool*
*${timestamp}*
`;
}

function main() {
  console.log('🔍 Starting Chart Background Transparency Verification...\n');

  // Analyze chart components
  const chartComponents = [
    { path: './src/components/ui/FixedPnLChart.tsx', name: 'FixedPnLChart' },
    { path: './src/components/ui/PnLChart.tsx', name: 'PnLChart' },
    { path: './src/components/ui/EmotionRadar.tsx', name: 'EmotionRadar' },
    { path: './src/components/ui/PerformanceChart.tsx', name: 'PerformanceChart' },
    { path: './src/components/ui/EquityGraph.tsx', name: 'EquityGraph' },
    { path: './src/components/ui/MarketDistributionChart.tsx', name: 'MarketDistributionChart' },
    { path: './src/components/ui/PerformanceTrendChart.tsx', name: 'PerformanceTrendChart' },
    { path: './src/components/ui/StrategyPerformanceChart.tsx', name: 'StrategyPerformanceChart' }
  ];

  const analyses = chartComponents.map(component => 
    analyzeChartComponent(component.path, component.name)
  );

  // Check Balatro integration
  const balatroIntegration = checkBalatroIntegration();

  // Generate report
  const report = generateReport(analyses, balatroIntegration);

  // Save report
  fs.writeFileSync('CHART_BACKGROUND_TRANSPARENCY_VERIFICATION_REPORT.md', report);
  
  // Also save JSON results for programmatic access
  const jsonResults = {
    timestamp: new Date().toISOString(),
    overallStatus: analyses.some(a => a.status === 'FAIL') || balatroIntegration.status === 'FAIL' ? 'FAIL' : 
               analyses.some(a => a.status === 'WARNING') || balatroIntegration.status === 'WARNING' ? 'WARNING' : 'PASS',
    balatroIntegration,
    chartAnalyses: analyses,
    summary: {
      totalCharts: analyses.length,
      passedCharts: analyses.filter(a => a.status === 'PASS').length,
      failedCharts: analyses.filter(a => a.status === 'FAIL').length,
      warningCharts: analyses.filter(a => a.status === 'WARNING').length,
      errorCharts: analyses.filter(a => a.status === 'ERROR').length
    }
  };

  fs.writeFileSync('chart-transparency-verification-results.json', JSON.stringify(jsonResults, null, 2));

  console.log('\n✅ Chart Background Transparency Verification Complete!');
  console.log('📁 Results saved to:');
  console.log('   - CHART_BACKGROUND_TRANSPARENCY_VERIFICATION_REPORT.md');
  console.log('   - chart-transparency-verification-results.json');
  
  // Print summary to console
  console.log('\n📊 Summary:');
  console.log(`   Total Charts: ${analyses.length}`);
  console.log(`   Passed: ${analyses.filter(a => a.status === 'PASS').length}`);
  console.log(`   Failed: ${analyses.filter(a => a.status === 'FAIL').length}`);
  console.log(`   Warnings: ${analyses.filter(a => a.status === 'WARNING').length}`);
  console.log(`   Overall Status: ${jsonResults.overallStatus}`);
}

// Run the verification
main();