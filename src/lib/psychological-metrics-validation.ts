/**
 * Comprehensive validation utilities for psychological metrics
 * Ensures data integrity and prevents conflicting states between Discipline Level and Tilt Control
 */

import {
  ValidationResult,
  PsychologicalMetricsValidationResult,
  EmotionalDataValidationResult,
  ApiResponseValidationResult,
  PerformanceValidationResult,
  ComprehensiveValidationResult,
  ValidationError,
  ValidationErrorType,
  ValidationSeverity,
  ValidationConfig,
  DEFAULT_VALIDATION_CONFIG,
  EmotionalData,
  PsychologicalMetrics,
  ValidationContext,
  ValidationReport
} from '@/types/validation';

// Valid emotions from the TradeForm
const VALID_EMOTIONS = ['FOMO', 'REVENGE', 'TILT', 'OVERRISK', 'PATIENCE', 'REGRET', 'DISCIPLINE', 'CONFIDENT', 'ANXIOUS', 'NEUTRAL'];

/**
 * Creates a validation error object
 */
function createValidationError(
  type: ValidationErrorType,
  severity: ValidationSeverity,
  message: string,
  field?: string,
  value?: any,
  expectedValue?: any
): ValidationError {
  return {
    type,
    severity,
    message,
    field,
    value,
    expectedValue,
    timestamp: Date.now()
  };
}

/**
 * Validates psychological metrics for mathematical consistency and range validity
 */
export function validatePsychologicalMetrics(
  disciplineLevel: number,
  tiltControl: number,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): PsychologicalMetricsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validationErrors: ValidationError[] = [];
  
  // Range validation
  if (disciplineLevel < 0 || disciplineLevel > 100) {
    const error = createValidationError(
      ValidationErrorType.RANGE_ERROR,
      ValidationSeverity.CRITICAL,
      'Discipline Level must be between 0-100%',
      'disciplineLevel',
      disciplineLevel,
      '0-100'
    );
    errors.push(error.message);
    validationErrors.push(error);
  }
  
  if (tiltControl < 0 || tiltControl > 100) {
    const error = createValidationError(
      ValidationErrorType.RANGE_ERROR,
      ValidationSeverity.CRITICAL,
      'Tilt Control must be between 0-100%',
      'tiltControl',
      tiltControl,
      '0-100'
    );
    errors.push(error.message);
    validationErrors.push(error);
  }
  
  // Consistency validation - check deviation between metrics
  const deviation = Math.abs(disciplineLevel - tiltControl);
  if (deviation > config.maxDeviationBetweenMetrics) {
    const severity = config.strictMode ? ValidationSeverity.CRITICAL : ValidationSeverity.HIGH;
    const error = createValidationError(
      ValidationErrorType.CONSISTENCY_ERROR,
      severity,
      `Large deviation (${deviation.toFixed(1)}%) detected between Discipline Level and Tilt Control. Maximum allowed: ${config.maxDeviationBetweenMetrics}%`,
      'metrics',
      { disciplineLevel, tiltControl, deviation },
      `deviation <= ${config.maxDeviationBetweenMetrics}%`
    );
    
    if (config.strictMode) {
      errors.push(error.message);
    } else {
      warnings.push(error.message);
    }
    validationErrors.push(error);
  }
  
  // Impossible state validation
  if (disciplineLevel > 90 && tiltControl < 10) {
    const error = createValidationError(
      ValidationErrorType.CONSISTENCY_ERROR,
      ValidationSeverity.CRITICAL,
      'Impossible psychological state detected: Very high discipline with very low tilt control',
      'metrics',
      { disciplineLevel, tiltControl },
      'consistent psychological state'
    );
    errors.push(error.message);
    validationErrors.push(error);
  }
  
  if (disciplineLevel < 10 && tiltControl > 90) {
    const error = createValidationError(
      ValidationErrorType.CONSISTENCY_ERROR,
      ValidationSeverity.CRITICAL,
      'Impossible psychological state detected: Very low discipline with very high tilt control',
      'metrics',
      { disciplineLevel, tiltControl },
      'consistent psychological state'
    );
    errors.push(error.message);
    validationErrors.push(error);
  }
  
  // Calculate psychological stability index
  const psychologicalStabilityIndex = (disciplineLevel + tiltControl) / 2;
  
  // Check minimum psychological stability index
  if (psychologicalStabilityIndex < config.minPsychologicalStabilityIndex) {
    const error = createValidationError(
      ValidationErrorType.CONSISTENCY_ERROR,
      ValidationSeverity.MEDIUM,
      `Psychological Stability Index (${psychologicalStabilityIndex.toFixed(1)}%) is below minimum threshold (${config.minPsychologicalStabilityIndex}%)`,
      'psychologicalStabilityIndex',
      psychologicalStabilityIndex,
      `>= ${config.minPsychologicalStabilityIndex}%`
    );
    warnings.push(error.message);
    validationErrors.push(error);
  }
  
  // Auto-correction if enabled
  let correctedDisciplineLevel = disciplineLevel;
  let correctedTiltControl = tiltControl;
  
  if (config.enableAutoCorrection && errors.length > 0) {
    // Apply range corrections
    correctedDisciplineLevel = Math.max(0, Math.min(100, disciplineLevel));
    correctedTiltControl = Math.max(0, Math.min(100, tiltControl));
    
    // Apply consistency corrections
    if (Math.abs(correctedDisciplineLevel - correctedTiltControl) > config.maxDeviationBetweenMetrics) {
      const average = (correctedDisciplineLevel + correctedTiltControl) / 2;
      const maxDeviation = config.maxDeviationBetweenMetrics;
      
      if (correctedDisciplineLevel > correctedTiltControl) {
        correctedTiltControl = Math.max(0, correctedDisciplineLevel - maxDeviation);
      } else {
        correctedDisciplineLevel = Math.max(0, correctedTiltControl - maxDeviation);
      }
    }
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings,
    disciplineLevel: correctedDisciplineLevel,
    tiltControl: correctedTiltControl,
    psychologicalStabilityIndex,
    deviation,
    correctedData: config.enableAutoCorrection ? {
      disciplineLevel: correctedDisciplineLevel,
      tiltControl: correctedTiltControl,
      psychologicalStabilityIndex: (correctedDisciplineLevel + correctedTiltControl) / 2
    } : undefined
  };
}

/**
 * Validates emotional data structure and values
 */
export function validateEmotionalData(
  emotionalData: EmotionalData[],
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): EmotionalDataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validEmotions: string[] = [];
  const invalidEmotions: string[] = [];
  const duplicateEmotions: string[] = [];
  
  // Check for null or undefined data
  if (!emotionalData) {
    const error = createValidationError(
      ValidationErrorType.NULL_VALUE_ERROR,
      ValidationSeverity.CRITICAL,
      'Emotional data is null or undefined',
      'emotionalData'
    );
    errors.push(error.message);
    return {
      isValid: false,
      errors,
      warnings,
      validEmotions,
      invalidEmotions,
      totalEmotions: 0,
      duplicateEmotions
    };
  }
  
  // Check if data is an array
  if (!Array.isArray(emotionalData)) {
    const error = createValidationError(
      ValidationErrorType.TYPE_ERROR,
      ValidationSeverity.CRITICAL,
      'Emotional data must be an array',
      'emotionalData',
      typeof emotionalData,
      'array'
    );
    errors.push(error.message);
    return {
      isValid: false,
      errors,
      warnings,
      validEmotions,
      invalidEmotions,
      totalEmotions: 0,
      duplicateEmotions
    };
  }
  
  // Check for empty array
  if (emotionalData.length === 0) {
    const warning = createValidationError(
      ValidationErrorType.DATA_INTEGRITY_ERROR,
      ValidationSeverity.MEDIUM,
      'Emotional data array is empty',
      'emotionalData'
    );
    warnings.push(warning.message);
    return {
      isValid: true,
      errors,
      warnings,
      validEmotions,
      invalidEmotions,
      totalEmotions: 0,
      duplicateEmotions
    };
  }
  
  const emotionNames = new Set<string>();
  
  // Validate each emotion entry
  emotionalData.forEach((emotion, index) => {
    // Check required fields
    if (!emotion.subject || typeof emotion.subject !== 'string') {
      const error = createValidationError(
        ValidationErrorType.DATA_INTEGRITY_ERROR,
        ValidationSeverity.HIGH,
        `Emotion at index ${index} has invalid or missing subject field`,
        `emotionalData[${index}].subject`,
        emotion.subject,
        'string'
      );
      errors.push(error.message);
      return;
    }
    
    const emotionName = emotion.subject.toUpperCase().trim();
    
    // Check for duplicates
    if (emotionNames.has(emotionName)) {
      duplicateEmotions.push(emotionName);
      const warning = createValidationError(
        ValidationErrorType.DATA_INTEGRITY_ERROR,
        ValidationSeverity.MEDIUM,
        `Duplicate emotion found: ${emotionName}`,
        `emotionalData[${index}].subject`,
        emotionName
      );
      warnings.push(warning.message);
    } else {
      emotionNames.add(emotionName);
    }
    
    // Validate emotion name
    if (VALID_EMOTIONS.includes(emotionName)) {
      validEmotions.push(emotionName);
    } else {
      invalidEmotions.push(emotionName);
      const warning = createValidationError(
        ValidationErrorType.DATA_INTEGRITY_ERROR,
        ValidationSeverity.LOW,
        `Unknown emotion: ${emotionName}`,
        `emotionalData[${index}].subject`,
        emotionName,
        VALID_EMOTIONS
      );
      warnings.push(warning.message);
    }
    
    // Validate value field
    if (typeof emotion.value !== 'number' || isNaN(emotion.value)) {
      const error = createValidationError(
        ValidationErrorType.TYPE_ERROR,
        ValidationSeverity.HIGH,
        `Emotion ${emotionName} has invalid value: ${emotion.value}`,
        `emotionalData[${index}].value`,
        emotion.value,
        'number'
      );
      errors.push(error.message);
    } else if (emotion.value < 0 || emotion.value > 100) {
      const error = createValidationError(
        ValidationErrorType.RANGE_ERROR,
        ValidationSeverity.HIGH,
        `Emotion ${emotionName} value (${emotion.value}) must be between 0-100`,
        `emotionalData[${index}].value`,
        emotion.value,
        '0-100'
      );
      errors.push(error.message);
    }
    
    // Validate fullMark field
    if (emotion.fullMark && (typeof emotion.fullMark !== 'number' || emotion.fullMark <= 0)) {
      const error = createValidationError(
        ValidationErrorType.RANGE_ERROR,
        ValidationSeverity.MEDIUM,
        `Emotion ${emotionName} has invalid fullMark: ${emotion.fullMark}`,
        `emotionalData[${index}].fullMark`,
        emotion.fullMark,
        'positive number'
      );
      errors.push(error.message);
    }
    
    // Validate leaning field
    if (emotion.leaning && typeof emotion.leaning !== 'string') {
      const warning = createValidationError(
        ValidationErrorType.TYPE_ERROR,
        ValidationSeverity.LOW,
        `Emotion ${emotionName} has invalid leaning type`,
        `emotionalData[${index}].leaning`,
        typeof emotion.leaning,
        'string'
      );
      warnings.push(warning.message);
    }
  });
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings,
    validEmotions,
    invalidEmotions,
    totalEmotions: emotionalData.length,
    duplicateEmotions
  };
}

/**
 * Validates API response data and performance
 */
export function validateApiResponse(
  responseData: any,
  responseTime: number,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ApiResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check response time
  if (responseTime > config.maxCalculationTime) {
    const error = createValidationError(
      ValidationErrorType.PERFORMANCE_ERROR,
      ValidationSeverity.HIGH,
      `API response time (${responseTime}ms) exceeds maximum allowed (${config.maxCalculationTime}ms)`,
      'responseTime',
      responseTime,
      `<= ${config.maxCalculationTime}ms`
    );
    warnings.push(error.message);
  }
  
  // Check response data structure
  if (!responseData || typeof responseData !== 'object') {
    const error = createValidationError(
      ValidationErrorType.TYPE_ERROR,
      ValidationSeverity.CRITICAL,
      'API response data is not a valid object',
      'responseData',
      typeof responseData,
      'object'
    );
    errors.push(error.message);
    return {
      isValid: false,
      errors,
      warnings,
      responseTime
    };
  }
  
  // Check required fields
  const requiredFields = ['totalTrades', 'totalPnL', 'winRate', 'emotionalData'];
  requiredFields.forEach(field => {
    if (!(field in responseData)) {
      const error = createValidationError(
        ValidationErrorType.DATA_INTEGRITY_ERROR,
        ValidationSeverity.HIGH,
        `Missing required field in API response: ${field}`,
        field,
        undefined,
        'required'
      );
      errors.push(error.message);
    }
  });
  
  // Validate data types
  if (responseData.totalTrades !== undefined && (typeof responseData.totalTrades !== 'number' || responseData.totalTrades < 0)) {
    const error = createValidationError(
      ValidationErrorType.TYPE_ERROR,
      ValidationSeverity.HIGH,
      'totalTrades must be a non-negative number',
      'totalTrades',
      responseData.totalTrades,
      'number >= 0'
    );
    errors.push(error.message);
  }
  
  if (responseData.totalPnL !== undefined && (typeof responseData.totalPnL !== 'number' || isNaN(responseData.totalPnL))) {
    const error = createValidationError(
      ValidationErrorType.TYPE_ERROR,
      ValidationSeverity.HIGH,
      'totalPnL must be a valid number',
      'totalPnL',
      responseData.totalPnL,
      'number'
    );
    errors.push(error.message);
  }
  
  if (responseData.winRate !== undefined && (typeof responseData.winRate !== 'number' || responseData.winRate < 0 || responseData.winRate > 100)) {
    const error = createValidationError(
      ValidationErrorType.RANGE_ERROR,
      ValidationSeverity.HIGH,
      'winRate must be between 0-100',
      'winRate',
      responseData.winRate,
      '0-100'
    );
    errors.push(error.message);
  }
  
  // Calculate approximate data size
  const dataSize = JSON.stringify(responseData).length;
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings,
    responseTime,
    dataSize,
    timestamp: Date.now()
  };
}

/**
 * Validates performance metrics
 */
export function validatePerformance(
  calculationTime: number,
  memoryUsage?: number,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): PerformanceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check calculation time
  if (calculationTime > config.maxCalculationTime) {
    const error = createValidationError(
      ValidationErrorType.PERFORMANCE_ERROR,
      ValidationSeverity.HIGH,
      `Calculation time (${calculationTime}ms) exceeds maximum allowed (${config.maxCalculationTime}ms)`,
      'calculationTime',
      calculationTime,
      `<= ${config.maxCalculationTime}ms`
    );
    errors.push(error.message);
  }
  
  // Check memory usage if provided
  if (memoryUsage !== undefined) {
    const maxMemoryUsage = 50 * 1024 * 1024; // 50MB
    if (memoryUsage > maxMemoryUsage) {
      const error = createValidationError(
        ValidationErrorType.PERFORMANCE_ERROR,
        ValidationSeverity.MEDIUM,
        `Memory usage (${(memoryUsage / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit (${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB)`,
        'memoryUsage',
        memoryUsage,
        `<= ${maxMemoryUsage} bytes`
      );
      warnings.push(error.message);
    }
  }
  
  const isWithinPerformanceThreshold = calculationTime <= config.maxCalculationTime;
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculationTime,
    memoryUsage,
    isWithinPerformanceThreshold
  };
}

/**
 * Performs comprehensive validation of all components
 */
export function performComprehensiveValidation(
  disciplineLevel: number,
  tiltControl: number,
  emotionalData: EmotionalData[],
  responseTime: number,
  calculationTime: number,
  memoryUsage?: number,
  responseData?: any,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ComprehensiveValidationResult {
  // Validate psychological metrics
  const psychologicalMetrics = validatePsychologicalMetrics(disciplineLevel, tiltControl, config);
  
  // Validate emotional data
  const emotionalDataValidation = validateEmotionalData(emotionalData, config);
  
  // Validate API response
  const apiResponse = validateApiResponse(responseData || {}, responseTime, config);
  
  // Validate performance
  const performance = validatePerformance(calculationTime, memoryUsage, config);
  
  // Calculate overall validation result
  const allErrors = [
    ...psychologicalMetrics.errors,
    ...emotionalDataValidation.errors,
    ...apiResponse.errors,
    ...performance.errors
  ];
  
  const allWarnings = [
    ...psychologicalMetrics.warnings,
    ...emotionalDataValidation.warnings,
    ...apiResponse.warnings,
    ...performance.warnings
  ];
  
  const overall: ValidationResult = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
  
  return {
    psychologicalMetrics,
    emotionalData: emotionalDataValidation,
    apiResponse,
    performance,
    overall
  };
}

/**
 * Creates a validation report for logging and debugging
 */
export function createValidationReport(
  context: ValidationContext,
  validationResults: ComprehensiveValidationResult
): ValidationReport {
  const summary = {
    totalErrors: validationResults.overall.errors.length,
    totalWarnings: validationResults.overall.warnings.length,
    criticalIssues: validationResults.overall.errors.filter(e => e.includes('Critical')).length,
    performanceIssues: validationResults.performance.errors.length + validationResults.performance.warnings.length,
    isOverallValid: validationResults.overall.isValid
  };
  
  const recommendations: string[] = [];
  
  if (validationResults.psychologicalMetrics.errors.length > 0) {
    recommendations.push('Review psychological metrics calculation logic and input data');
  }
  
  if (validationResults.emotionalData.errors.length > 0) {
    recommendations.push('Validate emotional data input and ensure proper data structure');
  }
  
  if (validationResults.performance.errors.length > 0) {
    recommendations.push('Optimize calculation algorithms and consider caching strategies');
  }
  
  if (validationResults.psychologicalMetrics.warnings.length > 0) {
    recommendations.push('Monitor psychological metrics consistency and user feedback');
  }
  
  return {
    context,
    results: validationResults,
    summary,
    recommendations
  };
}

/**
 * Logs validation results if logging is enabled
 */
export function logValidationResults(
  context: ValidationContext,
  validationResults: ComprehensiveValidationResult
): void {
  if (!context.config.logValidationFailures) {
    return;
  }
  
  const report = createValidationReport(context, validationResults);
  
  if (!validationResults.overall.isValid) {
    console.error('🚨 [VALIDATION] Validation failed:', {
      requestId: context.requestId,
      userId: context.userId,
      timestamp: new Date(context.timestamp).toISOString(),
      summary: report.summary,
      errors: validationResults.overall.errors,
      recommendations: report.recommendations
    });
  } else if (validationResults.overall.warnings.length > 0) {
    console.warn('⚠️ [VALIDATION] Validation completed with warnings:', {
      requestId: context.requestId,
      userId: context.userId,
      timestamp: new Date(context.timestamp).toISOString(),
      warnings: validationResults.overall.warnings
    });
  } else {
    console.log('✅ [VALIDATION] Validation completed successfully:', {
      requestId: context.requestId,
      userId: context.userId,
      timestamp: new Date(context.timestamp).toISOString(),
      performance: {
        calculationTime: validationResults.performance.calculationTime,
        memoryUsage: validationResults.performance.memoryUsage
      }
    });
  }
}

/**
 * Creates a validation context
 */
export function createValidationContext(
  requestId: string,
  userId?: string,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationContext {
  return {
    requestId,
    userId,
    timestamp: Date.now(),
    config,
    performanceMetrics: {
      startTime: Date.now()
    }
  };
}

/**
 * Finalizes validation context with performance metrics
 */
export function finalizeValidationContext(context: ValidationContext): ValidationContext {
  return {
    ...context,
    performanceMetrics: {
      ...context.performanceMetrics,
      endTime: Date.now(),
      calculationTime: Date.now() - context.performanceMetrics.startTime
    }
  };
}

// Re-export DEFAULT_VALIDATION_CONFIG for external use
export { DEFAULT_VALIDATION_CONFIG };

// Re-export types for external use
export type {
  ValidationResult,
  PsychologicalMetricsValidationResult,
  EmotionalDataValidationResult,
  ApiResponseValidationResult,
  PerformanceValidationResult,
  ComprehensiveValidationResult,
  ValidationError,
  ValidationErrorType,
  ValidationSeverity,
  ValidationConfig,
  EmotionalData,
  PsychologicalMetrics,
  ValidationContext,
  ValidationReport
};