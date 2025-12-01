// API Key Length Validation Utility
// Purpose: Debug why API key is being detected as truncated

export function validateApiKeyLength(apiKey: string | undefined): {
  isValid: boolean;
  length: number;
  expectedMinLength: number;
  actualSegments: string[];
  expectedSegments: string[];
  diagnosis: string;
} {
  if (!apiKey) {
    return {
      isValid: false,
      length: 0,
      expectedMinLength: 200,
      actualSegments: [],
      expectedSegments: ['header', 'payload', 'signature'],
      diagnosis: 'API key is missing or undefined'
    };
  }

  const length = apiKey.length;
  const expectedMinLength = 200;
  
  // Parse JWT segments
  const segments = apiKey.split('.');
  const expectedSegments = ['header', 'payload', 'signature'];
  
  // Primary validation: JWT structure (most important)
  const hasValidJWTStructure = segments.length === 3;
  const hasValidHeader = segments[0] && segments[0].length >= 20; // Header should be reasonable length
  const hasValidPayload = segments[1] && segments[1].length >= 20; // Payload should be reasonable length
  const hasValidSignature = segments[2] && segments[2].length >= 43; // HS256 signature is 43 chars
  
  // Secondary validation: length (support both 208-char and 300+ char keys)
  const hasValidLength = length >= expectedMinLength;
  
  // Detailed analysis - prioritize JWT structure over length
  const analysis = {
    isValid: Boolean(hasValidJWTStructure && hasValidHeader && hasValidPayload && hasValidSignature && hasValidLength),
    length,
    expectedMinLength,
    actualSegments: segments,
    expectedSegments,
    diagnosis: ''
  };

  // Generate detailed diagnosis
  if (!hasValidJWTStructure) {
    analysis.diagnosis = `JWT has ${segments.length} segments (expected 3). `;
  } else if (!hasValidHeader) {
    analysis.diagnosis = `JWT header segment is too short (${segments[0]?.length || 0} chars). `;
  } else if (!hasValidPayload) {
    analysis.diagnosis = `JWT payload segment is too short (${segments[1]?.length || 0} chars). `;
  } else if (!hasValidSignature) {
    analysis.diagnosis = `JWT signature segment is too short (${segments[2]?.length || 0} chars, expected 43+ for HS256). `;
  } else if (!hasValidLength) {
    analysis.diagnosis = `API key is ${expectedMinLength - length} characters too short. `;
  } else {
    analysis.diagnosis = 'API key has valid JWT structure and length';
  }

  // Log detailed analysis
  console.log('🔍 [API_KEY_VALIDATOR] Detailed Analysis:', {
    length,
    isValid: analysis.isValid,
    segments: segments.length,
    segmentLengths: segments.map(s => s.length),
    headerLength: segments[0]?.length || 0,
    payloadLength: segments[1]?.length || 0,
    signatureLength: segments[2]?.length || 0,
    diagnosis: analysis.diagnosis
  });

  return analysis;
}

// Test with current environment variable
export function testCurrentApiKey() {
  const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('🔍 [API_KEY_VALIDATOR] Testing current API key from environment:');
  
  const validation = validateApiKeyLength(currentKey);
  
  console.log('🔍 [API_KEY_VALIDATOR] Validation Result:', validation);
  
  // Additional checks
  if (currentKey) {
    console.log('🔍 [API_KEY_VALIDATOR] Raw Key Analysis:', {
      startsWithEyJ: currentKey.startsWith('eyJ'),
      endsWithValidPattern: /[a-zA-Z0-9_-]/.test(currentKey.slice(-1)),
      hasThreeSegments: currentKey.split('.').length === 3,
      fullKeyPreview: currentKey.substring(0, 50) + '...' + currentKey.substring(currentKey.length - 10)
    });
  }
  
  return validation;
}