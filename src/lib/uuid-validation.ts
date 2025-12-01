/**
 * UUID Validation Utility Functions
 * 
 * This module provides comprehensive UUID validation functions to prevent
 * "invalid input syntax for type uuid: 'undefined'" errors throughout the application.
 */

/**
 * Regular expression pattern for UUID validation
 * Matches UUIDs in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is a hexadecimal digit (0-9, a-f, A-F)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Type definition for a valid UUID string
 */
export type UUID = string;

/**
 * Validates if a string is a proper UUID format
 * 
 * @param value - The value to validate
 * @returns True if the value is a valid UUID, false otherwise
 * 
 * @example
 * ```typescript
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000'); // true
 * isValidUUID('invalid-uuid'); // false
 * isValidUUID(undefined); // false
 * isValidUUID(null); // false
 * ```
 */
export function isValidUUID(value: unknown): value is UUID {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value !== 'string') {
    return false;
  }
  
  // Handle edge cases like empty strings and "undefined" strings
  if (value.trim() === '' || value === 'undefined') {
    return false;
  }
  
  return UUID_REGEX.test(value);
}

/**
 * Validates a UUID and throws descriptive errors for invalid UUIDs
 * 
 * @param value - The value to validate
 * @param paramName - Optional parameter name for error messages
 * @returns The validated UUID string
 * @throws Error with descriptive message if the value is not a valid UUID
 * 
 * @example
 * ```typescript
 * try {
 *   const uuid = validateUUID('123e4567-e89b-12d3-a456-426614174000', 'userId');
 *   // uuid is now confirmed to be a valid UUID
 * } catch (error) {
 *   console.error(error.message); // "Invalid UUID for parameter 'userId': ..."
 * }
 * ```
 */
export function validateUUID(value: unknown, paramName?: string): UUID {
  const paramNameStr = paramName ? `for parameter '${paramName}'` : '';
  
  if (value === null) {
    throw new Error(`Invalid UUID ${paramNameStr}: value is null`);
  }
  
  if (value === undefined) {
    throw new Error(`Invalid UUID ${paramNameStr}: value is undefined`);
  }
  
  if (typeof value !== 'string') {
    throw new Error(`Invalid UUID ${paramNameStr}: expected string but got ${typeof value}`);
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue === '') {
    throw new Error(`Invalid UUID ${paramNameStr}: value is an empty string`);
  }
  
  if (trimmedValue === 'undefined') {
    throw new Error(`Invalid UUID ${paramNameStr}: value is the string 'undefined'`);
  }
  
  if (!UUID_REGEX.test(trimmedValue)) {
    throw new Error(`Invalid UUID ${paramNameStr}: '${trimmedValue}' does not match UUID format`);
  }
  
  return trimmedValue;
}

/**
 * Sanitizes a UUID value, handling edge cases
 * 
 * @param value - The value to sanitize
 * @returns The sanitized UUID or null if invalid
 * 
 * @example
 * ```typescript
 * sanitizeUUID('123e4567-e89b-12d3-a456-426614174000'); // '123e4567-e89b-12d3-a456-426614174000'
 * sanitizeUUID('  123e4567-e89b-12d3-a456-426614174000  '); // '123e4567-e89b-12d3-a456-426614174000'
 * sanitizeUUID('undefined'); // null
 * sanitizeUUID(null); // null
 * sanitizeUUID('invalid-uuid'); // null
 * ```
 */
export function sanitizeUUID(value: unknown): UUID | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value !== 'string') {
    return null;
  }
  
  const trimmedValue = value.trim();
  
  // Handle edge cases
  if (trimmedValue === '' || trimmedValue === 'undefined') {
    return null;
  }
  
  return isValidUUID(trimmedValue) ? trimmedValue : null;
}

/**
 * Interface for batch UUID validation results
 */
export interface UUIDValidationResult {
  /** Array of valid UUIDs */
  valid: UUID[];
  /** Array of invalid values with their original values and reasons */
  invalid: Array<{
    value: unknown;
    reason: string;
  }>;
  /** Whether all UUIDs in the batch are valid */
  allValid: boolean;
}

/**
 * Validates an array of UUIDs
 * 
 * @param values - Array of values to validate
 * @returns Validation result with valid and invalid UUIDs
 * 
 * @example
 * ```typescript
 * const result = validateUUIDs([
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   'invalid-uuid',
 *   undefined,
 *   '987e6543-e21b-43d3-a456-426614174999'
 * ]);
 * 
 * console.log(result.valid); // Array of valid UUIDs
 * console.log(result.invalid); // Array of invalid values with reasons
 * console.log(result.allValid); // false
 * ```
 */
export function validateUUIDs(values: unknown[]): UUIDValidationResult {
  const valid: UUID[] = [];
  const invalid: Array<{ value: unknown; reason: string }> = [];
  
  values.forEach((value, index) => {
    try {
      const uuid = validateUUID(value, `values[${index}]`);
      valid.push(uuid);
    } catch (error) {
      invalid.push({
        value,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return {
    valid,
    invalid,
    allValid: invalid.length === 0
  };
}

/**
 * Utility function to check if a value might be a UUID but needs validation
 * This is a lightweight check before full validation
 * 
 * @param value - The value to check
 * @returns True if the value could potentially be a UUID
 * 
 * @example
 * ```typescript
 * mightBeUUID('123e4567-e89b-12d3-a456-426614174000'); // true
 * mightBeUUID('not-a-uuid'); // false
 * mightBeUUID(123); // false
 * ```
 */
export function mightBeUUID(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Quick check: UUIDs are 36 characters with 4 hyphens
  const trimmed = value.trim();
  return trimmed.length === 36 && trimmed.split('-').length === 5;
}