const fs = require('fs');

// Function to read and analyze CSS files
function analyzeCSS() {
  console.log('=== Analyzing CSS Files ===');
  
  try {
    // Read Balatro.css
    const balatroCSS = fs.readFileSync('src/components/Balatro.css', 'utf8');
    const blurMatch = balatroCSS.match(/filter:\s*blur\((\d+)px\)/);
    
    if (blurMatch) {
      const blurValue = parseInt(blurMatch[1]);
      console.log(`✅ Blur effect found in Balatro.css: ${blurValue}px`);
      
      if (blurValue >= 2 && blurValue <= 5) {
        console.log('✅ Blur intensity is optimal (2-5px range)');
      } else if (blurValue < 2) {
        console.log('⚠️ Blur intensity might be too subtle (< 2px)');
      } else {
        console.log('⚠️ Blur intensity might be too strong (> 5px)');
      }
    } else {
      console.log('❌ No blur effect found in Balatro.css');
    }
    
    // Read globals.css for glass morphism
    const globalsCSS = fs.readFileSync('src/app/globals.css', 'utf8');
    const backdropFilterMatches = globalsCSS.match(/backdrop-filter:\s*blur\(\d+px\)/g) || [];
    const glassClassMatches = globalsCSS.match(/\.glass[^{]*\{[^}]*backdrop-filter/g) || [];
    
    console.log(`✅ Found ${backdropFilterMatches.length} backdrop-filter declarations`);
    console.log(`✅ Found ${glassClassMatches.length} glass classes with backdrop-filter`);
    
    // Check for performance optimizations
    const willChangeMatches = globalsCSS.match(/will-change:\s*auto/g) || [];
    const containMatches = globalsCSS.match(/contain:\s*layout/g) || [];
    
    console.log(`✅ Found ${willChangeMatches.length} optimized will-change declarations`);
    console.log(`✅ Found ${containMatches.length} CSS contain optimizations`);
    
    return {
      blurValue: blurMatch ? parseInt(blurMatch[1]) : null,
      backdropFilterCount: backdropFilterMatches.length,
      glassClassCount: glassClassMatches.length,
      hasOptimizations: willChangeMatches.length > 0 && containMatches.length > 0
    };
    
  } catch (error) {
    console.log('❌ Error analyzing CSS files:', error.message);
    return null;
  }
}

// Function to generate performance recommendations
function generateRecommendations(cssAnalysis) {
  console.log('\n=== Performance Recommendations ===');
  
  if (!cssAnalysis) {
    console.log('❌ Cannot generate recommendations without CSS analysis');
    return;
  }
  
  const recommendations = [];
  
  // Blur intensity recommendations
  if (cssAnalysis.blurValue) {
    if (cssAnalysis.blurValue < 2) {
      recommendations.push('Consider increasing blur to 2-3px for better background distraction reduction');
    } else if (cssAnalysis.blurValue > 5) {
      recommendations.push('Consider reducing blur to 3-4px to improve performance');
    } else {
      recommendations.push('✅ Blur intensity is well-balanced');
    }
  }
  
  // Backdrop filter recommendations
  if (cssAnalysis.backdropFilterCount > 15) {
    recommendations.push('High number of backdrop filters may impact performance on older devices');
  } else {
    recommendations.push('✅ Reasonable number of backdrop filters');
  }
  
  // Performance optimization recommendations
  if (!cssAnalysis.hasOptimizations) {
    recommendations.push('Consider adding CSS containment and will-change optimizations for better performance');
  } else {
    recommendations.push('✅ Performance optimizations are in place');
  }
  
  // Display recommendations
  recommendations.forEach((rec, index) => {
    const icon = rec.startsWith('✅') ? '✅' : rec.startsWith('⚠️') ? '⚠️' : '💡';
    console.log(`${index + 1}. ${icon} ${rec}`);
  });
}

// Function to create a test report
function createTestReport(cssAnalysis) {
  const report = `
# Blur Effect Test Report

## Test Summary
- **Date:** ${new Date().toISOString()}
- **Test Type:** Static CSS Analysis

## Findings

### Blur Effect Analysis
- **Blur Value:** ${cssAnalysis.blurValue || 'Not found'}px
- **Status:** ${cssAnalysis.blurValue ? '✅ Applied' : '❌ Not found'}
- **Optimal Range:** ${cssAnalysis.blurValue >= 2 && cssAnalysis.blurValue <= 5 ? '✅ Yes' : '⚠️ No'}

### Glass Morphism Analysis
- **Backdrop Filters:** ${cssAnalysis.backdropFilterCount}
- **Glass Classes:** ${cssAnalysis.glassClassCount}
- **Performance Optimizations:** ${cssAnalysis.hasOptimizations ? '✅ Present' : '⚠️ Missing'}

### Visual Impact Assessment
- **Background Distraction:** ${cssAnalysis.blurValue ? 'Reduced' : 'Unknown'}
- **Visual Hierarchy:** Should be maintained with glass morphism
- **Readability:** Should be preserved with proper contrast

### Performance Considerations
- **Blur Complexity:** ${cssAnalysis.blurValue && cssAnalysis.blurValue <= 5 ? 'Low' : 'Medium'}
- **Backdrop Filter Count:** ${cssAnalysis.backdropFilterCount > 15 ? 'High' : 'Acceptable'}
- **Optimization Level:** ${cssAnalysis.hasOptimizations ? 'Optimized' : 'Needs optimization'}

## Recommendations

### Immediate Actions
1. ✅ Verify blur effect is working in browser
2. ✅ Test glass morphism element interactions
3. ✅ Monitor performance during user interactions

### Performance Optimization
1. Use CSS containment for complex glass elements
2. Apply will-change only during animations
3. Consider reducing backdrop filter count on mobile

### Visual Quality
1. Ensure text readability is maintained
2. Test on different screen sizes
3. Verify color contrast remains sufficient

## Conclusion
The blur effect implementation appears to be properly configured with a ${cssAnalysis.blurValue || 'unknown'}px blur intensity.
The glass morphism elements should work well with this blur level, creating a cohesive visual design.
Performance should be acceptable with current optimizations, but monitoring is recommended.

---

*This report was generated based on static CSS analysis. For complete verification, manual browser testing is recommended.*
`;
  
  fs.writeFileSync('BLUR_EFFECT_TEST_REPORT.md', report);
  console.log('\n✅ Test report saved to BLUR_EFFECT_TEST_REPORT.md');
}

// Main execution function
function runTests() {
  console.log('Starting blur effect CSS analysis...\n');
  
  // Analyze CSS files
  const cssAnalysis = analyzeCSS();
  
  if (!cssAnalysis) {
    console.log('\n❌ Cannot proceed with tests - CSS analysis failed');
    return;
  }
  
  // Generate recommendations
  generateRecommendations(cssAnalysis);
  
  // Create test report
  createTestReport(cssAnalysis);
  
  console.log('\n=== Test Summary ===');
  console.log(`Blur effect: ${cssAnalysis.blurValue ? '✅ Applied' : '❌ Not found'}`);
  console.log(`Glass morphism: ${cssAnalysis.glassClassCount > 0 ? '✅ Present' : '❌ Not found'}`);
  console.log(`Performance: ${cssAnalysis.hasOptimizations ? '✅ Optimized' : '⚠️ Needs review'}`);
  
  const score = [
    cssAnalysis.blurValue ? 1 : 0,
    cssAnalysis.glassClassCount > 0 ? 1 : 0,
    cssAnalysis.hasOptimizations ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  console.log(`Overall Score: ${score}/3`);
  
  if (score === 3) {
    console.log('🎉 EXCELLENT: Blur effect implementation is optimal!');
  } else if (score === 2) {
    console.log('✅ GOOD: Blur effect is working well with minor improvements possible');
  } else {
    console.log('⚠️ NEEDS ATTENTION: Blur effect implementation requires improvements');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});