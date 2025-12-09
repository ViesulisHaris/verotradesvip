/**
 * Validation types for psychological metrics and data integrity
 */

// Base validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedData?: any;
}

// Psychological metrics validation result
export interface PsychologicalMetricsValidationResult extends ValidationResult {
  disciplineLevel?: number;
  tiltControl?: number;
  psychologicalStabilityIndex?: number;
  deviation?: number;
}

// Emotional data validation result
export interface EmotionalDataValidationResult extends ValidationResult {
  validEmotions: string[];
  invalidEmotions: string[];
  totalEmotions: number;
  duplicateEmotions: string[];
}

// API response validation result
export interface ApiResponseValidationResult extends ValidationResult {
  responseTime?: number;
  dataSize?: number;
  timestamp?: number;
}

// Performance validation result
export interface PerformanceValidationResult extends ValidationResult {
  calculationTime: number;
  memoryUsage?: number;
  isWithinPerformanceThreshold: boolean;
}

// Comprehensive validation result for the entire system
export interface ComprehensiveValidationResult {
  psychologicalMetrics: PsychologicalMetricsValidationResult;
  emotionalData: EmotionalDataValidationResult;
  apiResponse: ApiResponseValidationResult;
  performance: PerformanceValidationResult;
  overall: ValidationResult;
}

// Validation severity levels
export enum ValidationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Validation error types
export enum ValidationErrorType {
  RANGE_ERROR = 'range_error',
  CONSISTENCY_ERROR = 'consistency_error',
  MATHEMATICAL_ERROR = 'mathematical_error',
  DATA_INTEGRITY_ERROR = 'data_integrity_error',
  PERFORMANCE_ERROR = 'performance_error',
  TYPE_ERROR = 'type_error',
  NULL_VALUE_ERROR = 'null_value_error'
}

// Detailed validation error
export interface ValidationError {
  type: ValidationErrorType;
  severity: ValidationSeverity;
  message: string;
  field?: string;
  value?: any;
  expectedValue?: any;
  timestamp: number;
}

// Validation configuration
export interface ValidationConfig {
  maxDeviationBetweenMetrics: number; // Maximum allowed deviation between discipline and tilt control
  minPsychologicalStabilityIndex: number;
  maxCalculationTime: number; // Maximum allowed calculation time in milliseconds
  enableAutoCorrection: boolean;
  enablePerformanceMonitoring: boolean;
  logValidationFailures: boolean;
  strictMode: boolean; // If true, warnings are treated as errors
}

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxDeviationBetweenMetrics: 15,
  minPsychologicalStabilityIndex: 20,
  maxCalculationTime: 2000, // Increased to 2000ms for realistic API response times
  enableAutoCorrection: true,
  enablePerformanceMonitoring: true,
  logValidationFailures: false, // Disable logging to reduce overhead
  strictMode: false
};

// Emotional data interface (matching the one in dashboard)
export interface EmotionalData {
  subject: string;
  value: number;
  fullMark: number;
  leaning: string;
  side: string;
  leaningValue?: number;
  totalTrades?: number;
}

// Psychological metrics interface
export interface PsychologicalMetrics {
  disciplineLevel: number;
  tiltControl: number;
  psychologicalStabilityIndex: number;
  deviation: number;
  isConsistent: boolean;
}

// Validation context for tracking validation state
export interface ValidationContext {
  requestId: string;
  userId?: string;
  timestamp: number;
  config: ValidationConfig;
  performanceMetrics: {
    startTime: number;
    endTime?: number;
    calculationTime?: number;
    memoryUsage?: number;
  };
}

// Validation report for logging and debugging
export interface ValidationReport {
  context: ValidationContext;
  results: ComprehensiveValidationResult;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    criticalIssues: number;
    performanceIssues: number;
    isOverallValid: boolean;
  };
  recommendations: string[];
}