# VeroTrade Rating System Reference

## Overview

The VeroTrade dashboard uses a comprehensive rating system to evaluate trading performance across multiple dimensions. This document explains the visual representations, calculations, and interpretation of each metric.

## Color Scheme

The rating system uses a consistent color scheme across all visualizations:

- **#D4C09A** (Gold): Excellent performance
- **#4F5B4A** (Gray-Green): Average/Good performance  
- **#8B2323** (Dark Red): Poor performance
- **#A7352D** (Light Red): Negative values/losses

## VRating Performance

### Scale
- **Range**: 1.0 - 10.0
- **Higher is better**: Indicates overall trading excellence

### Calculation
```
VRating = min(10, max(1, (WinRate / 10) + (ProfitFactor / 2)))
```

### Visual Representation
- **Gradient Line**: Shows performance spectrum from Poor (red) to Excellent (gold)
- **Dot Indicator**: White dot with colored border showing current position
- **Position Calculation**: `(VRating / 10) * 100%` along the gradient

### Interpretation
- **1.0 - 3.0**: Poor performance (red zone)
- **3.1 - 6.0**: Average performance (gray-green zone)
- **6.1 - 10.0**: Excellent performance (gold zone)

## Sharpe Ratio

### Scale
- **Range**: Typically -3.0 to +3.0 (can exceed 3.0 for exceptional performance)
- **Higher is better**: Risk-adjusted returns

### Calculation
```
Sharpe Ratio = Average Return / Standard Deviation of Returns
```

### Visual Representation
- **Gradient Line**: Shows risk-adjusted performance spectrum
- **Dot Indicator**: White dot with colored border showing current position
- **Position Calculation**: `(SharpeRatio / 3) * 100%` along the gradient

### Interpretation
- **< 0.5**: Poor risk-adjusted returns (red zone)
- **0.5 - 1.5**: Moderate risk-adjusted returns (gray-green zone)
- **> 1.5**: Excellent risk-adjusted returns (gold zone)

## Win Rate

### Scale
- **Range**: 0% - 100%
- **Higher is better**: Percentage of profitable trades

### Visual Representation
- **Color Coding**: 
  - **≥ 70%**: Gold (excellent)
  - **50% - 69%**: Gray-green (good)
  - **< 50%**: Red (poor)

### Interpretation
- **≥ 70%**: Excellent win rate
- **50% - 69%**: Good win rate
- **< 50%**: Poor win rate (needs improvement)

## Profit Factor

### Scale
- **Range**: 0 to ∞ (infinity)
- **Higher is better**: Ratio of gross profits to gross losses

### Calculation
```
Profit Factor = Gross Profit / |Gross Loss|
```

### Visual Representation
- **Color Coding**: Always displayed in gold for positive values
- **Special Cases**: 
  - **∞**: Positive profits with zero losses
  - **0**: Zero profits with losses

### Interpretation
- **≥ 2.0**: Excellent profit factor
- **1.5 - 1.9**: Good profit factor
- **1.0 - 1.4**: Acceptable profit factor
- **< 1.0**: Poor profit factor (losing money)

## Dominant Emotion

### Scale
- **Range**: 0% - 100%
- **Represents**: Most frequent emotional state during trading

### Visual Representation
- **Gradient Line**: Shows percentage distribution
- **Dot Indicator**: White dot with gold border showing current percentage
- **Position Calculation**: Direct percentage along the gradient

### Common Emotions
- **Neutral**: Balanced emotional state
- **Confident**: Positive trading mindset
- **Anxious**: Stressed or worried
- **Greedy**: Overly optimistic
- **Fearful**: Risk-averse mindset

## Visual Design Principles

### Gradient Lines
- **Height**: 12px (h-3) for better visibility
- **Border Radius**: Fully rounded for modern appearance
- **Inner Shadow**: Creates depth and professional look
- **Smooth Transitions**: 500ms duration for all animations

### Dot Indicators
- **Size**: 16px (w-4 h-4) for clear visibility
- **Border**: 2px colored border matching performance level
- **Shadow**: Glowing effect with matching color
- **Position**: Centered vertically on the gradient line

### Card Design
- **Background**: #1A1A1A (dark gray)
- **Border**: 0.8px rgba(184, 155, 94, 0.3) (subtle gold)
- **Shadow**: 0 4px 12px rgba(0, 0, 0, 0.15) for depth
- **Transitions**: 300ms ease for all hover effects

## Responsive Behavior

### Desktop (> 768px)
- **Grid Layout**: 2×3 grid for top/middle rows
- **Full Width**: Properties section spans entire width
- **Hover Effects**: Enhanced shadows and transforms

### Mobile (< 768px)
- **Stacked Layout**: Cards stack vertically
- **Reduced Padding**: Optimized for smaller screens
- **Touch-Friendly**: Larger tap targets for mobile interaction

## Performance Considerations

### Animation Optimization
- **GPU Acceleration**: Uses transform for smooth animations
- **Reduced Reflows**: Minimal layout changes during transitions
- **Efficient Updates**: Only necessary properties animate

### Accessibility
- **Color Contrast**: Meets WCAG AA standards
- **Semantic HTML**: Proper heading hierarchy
- **Keyboard Navigation**: All interactive elements accessible

## Data Accuracy

### Real-Time Updates
- **Live Indicators**: Pulsing dots show active data
- **Smooth Transitions**: Values update without jarring changes
- **Consistent Formatting**: Currency and percentage formatting

### Error Handling
- **Graceful Degradation**: Fallback values for missing data
- **Visual Feedback**: Clear indication of data availability
- **Consistent Behavior**: Predictable responses to edge cases

## Future Enhancements

### Planned Features
- **Historical Trends**: Time-based performance graphs
- **Comparative Analysis**: Benchmark against peer performance
- **Predictive Metrics**: AI-powered performance predictions
- **Custom Thresholds**: User-defined performance targets

### Visual Improvements
- **Micro-interactions**: Subtle feedback for user actions
- **Advanced Animations**: More sophisticated transition effects
- **Dark/Light Themes**: Multiple theme options
- **Customizable Layout**: Drag-and-drop card arrangement

---

*This document serves as a reference for developers, designers, and traders using the VeroTrade platform. For questions or suggestions regarding the rating system, please contact the development team.*