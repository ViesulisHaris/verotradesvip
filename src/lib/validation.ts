/**
 * Validation utilities for trade form fields
 * Addresses parseFloat() issues and adds proper validation
 */

// Maximum values for numeric fields based on typical trading scenarios
export const VALIDATION_LIMITS = {
  QUANTITY: {
    MIN: 0.00000001, // Minimum positive quantity (prevents zero)
    MAX: 1000000, // Maximum 1 million units
    MESSAGE: 'Quantity must be between 0.00000001 and 1,000,000'
  },
  PRICE: {
    MIN: 0.00000001, // Minimum positive price (prevents zero)
    MAX: 100000000, // Maximum 100 million per unit
    MESSAGE: 'Price must be between 0.00000001 and 100,000,000'
  },
  PNL: {
    MIN: -100000000, // Maximum loss of 100 million
    MAX: 100000000, // Maximum profit of 100 million
    MESSAGE: 'P&L must be between -100,000,000 and 100,000,000'
  }
} as const;

/**
 * Validates if a string contains only valid numeric characters
 * @param value - The string to validate
 * @returns boolean indicating if the string is a valid numeric format
 */
export const isValidNumericString = (value: string): boolean => {
  // Allow empty string (will be handled as null)
  if (value === '') return true;
  
  // Check for valid numeric format (optional decimal point, no special characters)
  // This regex allows: 123, 123.45, .123, 123., +123, -123
  return /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$/.test(value);
};

/**
 * Parses a numeric field value with proper validation
 * @param value - The string value to parse
 * @param fieldName - The name of the field for error messages
 * @returns Object containing parsed value and any validation error
 */
export const parseNumericField = (
  value: string,
  fieldName: 'quantity' | 'entry_price' | 'exit_price' | 'pnl'
): { value: number | null; error: string | null } => {
  // Handle empty string as null
  if (value === '' || value === null || value === undefined) {
    return { value: null, error: null };
  }

  // Check for special characters
  if (!isValidNumericString(value)) {
    return { 
      value: null, 
      error: `${fieldName} contains invalid characters. Only numbers and decimal points are allowed.` 
    };
  }

  // Parse the value
  const parsed = parseFloat(value);
  
  // Check if parsing resulted in NaN
  if (isNaN(parsed)) {
    return { value: null, error: `${fieldName} is not a valid number.` };
  }

  // Get validation limits based on field type
  let limits;
  switch (fieldName) {
    case 'quantity':
      limits = VALIDATION_LIMITS.QUANTITY;
      break;
    case 'entry_price':
    case 'exit_price':
      limits = VALIDATION_LIMITS.PRICE;
      break;
    case 'pnl':
      limits = VALIDATION_LIMITS.PNL;
      break;
    default:
      limits = VALIDATION_LIMITS.PRICE;
  }

  // Check minimum value (for quantity and prices, zero is not allowed)
  if (parsed < limits.MIN) {
    return { value: null, error: limits.MESSAGE };
  }

  // Check maximum value
  if (parsed > limits.MAX) {
    return { value: null, error: limits.MESSAGE };
  }

  return { value: parsed, error: null };
};

/**
 * Validates all numeric fields in a trade form
 * @param formData - The form data object
 * @returns Object containing validation results for all fields
 */
export const validateTradeNumericFields = (formData: {
  quantity: string;
  entry_price: string;
  exit_price: string;
  pnl: string;
}) => {
  const results = {
    quantity: parseNumericField(formData.quantity, 'quantity'),
    entry_price: parseNumericField(formData.entry_price, 'entry_price'),
    exit_price: parseNumericField(formData.exit_price, 'exit_price'),
    pnl: parseNumericField(formData.pnl, 'pnl')
  };

  const errors: string[] = [];
  const validData: { [key: string]: number | null } = {};

  // Collect errors and valid values
  Object.entries(results).forEach(([field, result]) => {
    if (result.error) {
      errors.push(result.error);
    }
    validData[field] = result.value;
  });

  return {
    isValid: errors.length === 0,
    errors,
    data: validData
  };
};

/**
 * Legacy function to replace parseFloat(value) || null pattern
 * Use this function to properly handle numeric field parsing
 * @param value - The string value to parse
 * @returns number | null with proper zero value handling
 */
export const safeParseFloat = (value: string): number | null => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};