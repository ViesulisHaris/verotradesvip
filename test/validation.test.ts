/**
 * Comprehensive validation tests for psychological metrics
 * Tests all validation layers to ensure data integrity and prevent conflicting states
 */

import {
  validatePsychologicalMetrics,
  validateEmotionalData,
  validateApiResponse,
  validatePerformance,
  performComprehensiveValidation,
  createValidationContext,
  finalizeValidationContext,
  logValidationResults,
  DEFAULT_VALIDATION_CONFIG
} from '@/src/lib/psychological-metrics-validation';

import {
  ValidationSeverity,
  ValidationErrorType,
  EmotionalData,
  PsychologicalMetrics
} from '@/src/types/validation';

// Test data factories
const createValidEmotionalData = (): EmotionalData[] => [
  { subject: 'DISCIPLINE', value: 75, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
  { subject: 'CONFIDENCE', value: 60, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
  { subject: 'PATIENCE', value: 80, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
  { subject: 'TILT', value: 25, fullMark: 100, leaning: 'Balanced', side: 'Sell' },
  { subject: 'ANXIOUS', value: 30, fullMark: 100, leaning: 'Balanced', side: 'Sell' }
];

const createInvalidEmotionalData = (): EmotionalData[] => [
  { subject: 'INVALID_EMOTION', value: 50, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
  { subject: '', value: 75, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
  { subject: 'DISCIPLINE', value: 150, fullMark: 100, leaning: 'Balanced', side: 'Buy' }, // Invalid value
  { subject: 'CONFIDENCE', value: -10, fullMark: 100, leaning: 'Balanced', side: 'Buy' } // Invalid value
];

const createValidApiResponse = () => ({
  totalTrades: 100,
  totalPnL: 5000,
  winRate: 65,
  avgTradeSize: 1000,
  emotionalData: createValidEmotionalData()
});

const createInvalidApiResponse = () => ({
  totalTrades: -10, // Invalid
  totalPnL: 'invalid', // Invalid type
  winRate: 150, // Invalid range
  avgTradeSize: 1000,
  emotionalData: createValidEmotionalData()
});

// Test suites
describe('Psychological Metrics Validation', () => {
  describe('validatePsychologicalMetrics', () => {
    test('should pass validation for valid metrics', () => {
      const result = validatePsychologicalMetrics(75, 70);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.disciplineLevel).toBe(75);
      expect(result.tiltControl).toBe(70);
      expect(result.psychologicalStabilityIndex).toBe(72.5);
      expect(result.deviation).toBe(5);
    });

    test('should fail validation for out-of-range metrics', () => {
      const result = validatePsychologicalMetrics(-10, 150);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Discipline Level must be between 0-100%');
      expect(result.errors).toContain('Tilt Control must be between 0-100%');
    });

    test('should warn for large deviation between metrics', () => {
      const result = validatePsychologicalMetrics(90, 20);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Large deviation (70.0%) detected');
    });

    test('should fail validation for impossible psychological states', () => {
      const result1 = validatePsychologicalMetrics(95, 5);
      const result2 = validatePsychologicalMetrics(5, 95);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Impossible psychological state detected: Very high discipline with very low tilt control');
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Impossible psychological state detected: Very low discipline with very high tilt control');
    });

    test('should auto-correct values when enabled', () => {
      const config = { ...DEFAULT_VALIDATION_CONFIG, enableAutoCorrection: true };
      const result = validatePsychologicalMetrics(-10, 150, config);
      
      expect(result.isValid).toBe(false); // Still invalid due to original errors
      expect(result.correctedData).toBeDefined();
      expect(result.correctedData!.disciplineLevel).toBe(0);
      expect(result.correctedData!.tiltControl).toBe(100);
    });

    test('should handle low psychological stability index', () => {
      const result = validatePsychologicalMetrics(5, 8);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Psychological Stability Index (6.5%) is below minimum threshold');
    });
  });

  describe('validateEmotionalData', () => {
    test('should pass validation for valid emotional data', () => {
      const result = validateEmotionalData(createValidEmotionalData());
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validEmotions).toContain('DISCIPLINE');
      expect(result.validEmotions).toContain('CONFIDENCE');
      expect(result.validEmotions).toContain('PATIENCE');
      expect(result.validEmotions).toContain('TILT');
      expect(result.validEmotions).toContain('ANXIOUS');
      expect(result.invalidEmotions).toHaveLength(0);
      expect(result.totalEmotions).toBe(5);
    });

    test('should fail validation for null emotional data', () => {
      const result = validateEmotionalData(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Emotional data is null or undefined');
    });

    test('should fail validation for invalid emotional data structure', () => {
      const result = validateEmotionalData(createInvalidEmotionalData());
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.invalidEmotions).toContain('INVALID_EMOTION');
    });

    test('should warn for duplicate emotions', () => {
      const dataWithDuplicates = [
        ...createValidEmotionalData(),
        { subject: 'DISCIPLINE', value: 50, fullMark: 100, leaning: 'Balanced', side: 'Buy' }
      ];
      const result = validateEmotionalData(dataWithDuplicates);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.duplicateEmotions).toContain('DISCIPLINE');
    });

    test('should handle empty emotional data array', () => {
      const result = validateEmotionalData([]);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('Emotional data array is empty');
    });
  });

  describe('validateApiResponse', () => {
    test('should pass validation for valid API response', () => {
      const result = validateApiResponse(createValidApiResponse(), 200);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.responseTime).toBe(200);
      expect(result.dataSize).toBeGreaterThan(0);
    });

    test('should fail validation for invalid API response', () => {
      const result = validateApiResponse(createInvalidApiResponse(), 200);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should warn for slow response time', () => {
      const result = validateApiResponse(createValidApiResponse(), 600);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('API response time (600ms) exceeds maximum allowed');
    });
  });

  describe('validatePerformance', () => {
    test('should pass validation for good performance', () => {
      const result = validatePerformance(100);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.isWithinPerformanceThreshold).toBe(true);
    });

    test('should fail validation for slow performance', () => {
      const result = validatePerformance(1000);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Calculation time (1000ms) exceeds maximum allowed');
      expect(result.isWithinPerformanceThreshold).toBe(false);
    });

    test('should warn for high memory usage', () => {
      const result = validatePerformance(100, 60 * 1024 * 1024); // 60MB
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Memory usage (60.00MB) exceeds recommended limit');
    });
  });

  describe('performComprehensiveValidation', () => {
    test('should pass comprehensive validation for valid data', () => {
      const result = performComprehensiveValidation(
        75, // disciplineLevel
        70, // tiltControl
        createValidEmotionalData(),
        200, // responseTime
        100, // calculationTime
        undefined, // memoryUsage
        createValidApiResponse()
      );
      
      expect(result.overall.isValid).toBe(true);
      expect(result.overall.errors).toHaveLength(0);
      expect(result.psychologicalMetrics.isValid).toBe(true);
      expect(result.emotionalData.isValid).toBe(true);
      expect(result.apiResponse.isValid).toBe(true);
      expect(result.performance.isValid).toBe(true);
    });

    test('should fail comprehensive validation for invalid data', () => {
      const result = performComprehensiveValidation(
        -10, // invalid disciplineLevel
        150, // invalid tiltControl
        createInvalidEmotionalData(),
        1000, // slow responseTime
        1000, // slow calculationTime
        undefined,
        createInvalidApiResponse()
      );
      
      expect(result.overall.isValid).toBe(false);
      expect(result.overall.errors.length).toBeGreaterThan(0);
      expect(result.psychologicalMetrics.isValid).toBe(false);
      expect(result.emotionalData.isValid).toBe(false);
      expect(result.apiResponse.isValid).toBe(false);
      expect(result.performance.isValid).toBe(false);
    });
  });

  describe('Validation Context', () => {
    test('should create validation context with required fields', () => {
      const context = createValidationContext('test-request-id', 'user-123');
      
      expect(context.requestId).toBe('test-request-id');
      expect(context.userId).toBe('user-123');
      expect(context.timestamp).toBeGreaterThan(0);
      expect(context.config).toEqual(DEFAULT_VALIDATION_CONFIG);
      expect(context.performanceMetrics.startTime).toBeGreaterThan(0);
    });

    test('should finalize validation context with performance metrics', () => {
      const context = createValidationContext('test-request-id', 'user-123');
      const finalized = finalizeValidationContext(context);
      
      expect(finalized.performanceMetrics.endTime).toBeGreaterThan(0);
      expect(finalized.performanceMetrics.calculationTime).toBeGreaterThan(0);
      expect(finalized.performanceMetrics.calculationTime).toBe(
        finalized.performanceMetrics.endTime! - finalized.performanceMetrics.startTime
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary values correctly', () => {
      const result1 = validatePsychologicalMetrics(0, 0);
      const result2 = validatePsychologicalMetrics(100, 100);
      const result3 = validatePsychologicalMetrics(50, 50);
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result3.isValid).toBe(true);
    });

    test('should handle maximum deviation boundary', () => {
      const config = { ...DEFAULT_VALIDATION_CONFIG, maxDeviationBetweenMetrics: 15 };
      const result1 = validatePsychologicalMetrics(80, 65, config); // 15% deviation
      const result2 = validatePsychologicalMetrics(80, 64, config); // 16% deviation
      
      expect(result1.isValid).toBe(true);
      expect(result1.warnings).toHaveLength(0);
      
      expect(result2.isValid).toBe(true);
      expect(result2.warnings).toHaveLength(1);
    });

    test('should handle empty and undefined values gracefully', () => {
      const result1 = validateEmotionalData(undefined);
      const result2 = validateEmotionalData([]);
      const result3 = validatePsychologicalMetrics(NaN, NaN);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(true); // Empty array is valid with warning
      expect(result2.warnings).toHaveLength(1);
      expect(result3.isValid).toBe(false);
    });
  });

  describe('Mathematical Consistency', () => {
    test('should detect inconsistent psychological states', () => {
      const testCases = [
        { discipline: 95, tiltControl: 5, shouldBeInvalid: true },
        { discipline: 5, tiltControl: 95, shouldBeInvalid: true },
        { discipline: 85, tiltControl: 20, shouldBeInvalid: true },
        { discipline: 20, tiltControl: 85, shouldBeInvalid: true }
      ];
      
      testCases.forEach(({ discipline, tiltControl, shouldBeInvalid }) => {
        const result = validatePsychologicalMetrics(discipline, tiltControl);
        
        if (shouldBeInvalid) {
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });

    test('should validate consistent psychological states', () => {
      const testCases = [
        { discipline: 80, tiltControl: 75 },
        { discipline: 60, tiltControl: 55 },
        { discipline: 40, tiltControl: 45 },
        { discipline: 20, tiltControl: 25 }
      ];
      
      testCases.forEach(({ discipline, tiltControl }) => {
        const result = validatePsychologicalMetrics(discipline, tiltControl);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Performance Validation', () => {
    test('should validate performance thresholds', () => {
      const testCases = [
        { time: 50, expectedValid: true },
        { time: 250, expectedValid: true },
        { time: 500, expectedValid: true },
        { time: 501, expectedValid: false },
        { time: 1000, expectedValid: false }
      ];
      
      testCases.forEach(({ time, expectedValid }) => {
        const result = validatePerformance(time);
        expect(result.isValid).toBe(expectedValid);
      });
    });

    test('should track memory usage correctly', () => {
      const testCases = [
        { memory: 10 * 1024 * 1024, expectedWarnings: 0 }, // 10MB
        { memory: 30 * 1024 * 1024, expectedWarnings: 0 }, // 30MB
        { memory: 60 * 1024 * 1024, expectedWarnings: 1 }, // 60MB
        { memory: 100 * 1024 * 1024, expectedWarnings: 1 } // 100MB
      ];
      
      testCases.forEach(({ memory, expectedWarnings }) => {
        const result = validatePerformance(100, memory);
        expect(result.warnings.length).toBe(expectedWarnings);
      });
    });
  });
});

// Integration tests
describe('Integration Tests', () => {
  test('should handle real-world validation scenario', () => {
    // Simulate a real-world scenario with mixed valid/invalid data
    const mixedEmotionalData = [
      { subject: 'DISCIPLINE', value: 85, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
      { subject: 'CONFIDENCE', value: 70, fullMark: 100, leaning: 'Balanced', side: 'Buy' },
      { subject: 'TILT', value: 40, fullMark: 100, leaning: 'Balanced', side: 'Sell' },
      { subject: 'UNKNOWN_EMOTION', value: 50, fullMark: 100, leaning: 'Balanced', side: 'Buy' }
    ];
    
    const context = createValidationContext('integration-test', 'user-456');
    const result = performComprehensiveValidation(
      85, // High discipline
      40, // Low tilt control (inconsistent)
      mixedEmotionalData,
      300, // Slow response time
      150, // Slow calculation time
      undefined,
      {
        totalTrades: 50,
        totalPnL: 2500,
        winRate: 60,
        avgTradeSize: 800,
        emotionalData: mixedEmotionalData
      }
    );
    
    // Should detect inconsistencies
    expect(result.overall.isValid).toBe(false);
    expect(result.psychologicalMetrics.errors.length).toBeGreaterThan(0);
    expect(result.emotionalData.warnings.length).toBeGreaterThan(0); // Unknown emotion
    expect(result.performance.errors.length).toBeGreaterThan(0); // Slow calculation
    
    // Should provide detailed error information
    expect(result.overall.errors.some(e => e.includes('impossible psychological state'))).toBe(true);
    expect(result.overall.warnings.some(e => e.includes('Unknown emotion'))).toBe(true);
    expect(result.overall.errors.some(e => e.includes('exceeds maximum allowed'))).toBe(true);
  });

  test('should handle auto-correction scenario', () => {
    const config = { ...DEFAULT_VALIDATION_CONFIG, enableAutoCorrection: true };
    const result = validatePsychologicalMetrics(-5, 120, config);
    
    expect(result.isValid).toBe(false); // Original values are invalid
    expect(result.correctedData).toBeDefined();
    expect(result.correctedData!.disciplineLevel).toBe(0); // Corrected to valid range
    expect(result.correctedData!.tiltControl).toBe(100); // Corrected to valid range
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  test('should validate calculation performance within acceptable limits', () => {
    const startTime = Date.now();
    
    // Run validation multiple times to get average
    for (let i = 0; i < 100; i++) {
      validatePsychologicalMetrics(
        Math.random() * 100,
        Math.random() * 100,
        createValidEmotionalData()
      );
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / 100;
    
    // Should average less than 10ms per validation
    expect(averageTime).toBeLessThan(10);
  });

  test('should handle large datasets efficiently', () => {
    const largeEmotionalData = Array.from({ length: 1000 }, (_, i) => ({
      subject: `EMOTION_${i}`,
      value: Math.random() * 100,
      fullMark: 100,
      leaning: 'Balanced',
      side: i % 2 === 0 ? 'Buy' : 'Sell'
    }));
    
    const startTime = Date.now();
    const result = validateEmotionalData(largeEmotionalData);
    const endTime = Date.now();
    
    // Should process large datasets quickly
    expect(endTime - startTime).toBeLessThan(100);
    expect(result.totalEmotions).toBe(1000);
  });
});

console.log('✅ Validation tests loaded successfully');