// Script to decode and validate JWT tokens
const jwt = require('jsonwebtoken');

require('dotenv').config();

console.log('='.repeat(80));
console.log('JWT TOKEN DECODE AND VALIDATION');
console.log('='.repeat(80));

// Function to decode JWT without verification (just to see the payload)
function decodeJWT(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded;
  } catch (error) {
    return { error: error.message };
  }
}

// Check ANON key
console.log('\n1. ANON Key Analysis:');
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const anonDecoded = decodeJWT(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (anonDecoded.error) {
    console.log('❌ ANON key decode error:', anonDecoded.error);
  } else {
    console.log('✅ ANON key decoded successfully');
    console.log('   Header:', JSON.stringify(anonDecoded.header, null, 2));
    console.log('   Payload:', JSON.stringify(anonDecoded.payload, null, 2));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (anonDecoded.payload.exp && anonDecoded.payload.exp < now) {
      console.log('❌ ANON key is EXPIRED');
    } else {
      console.log('✅ ANON key is not expired');
    }
  }
} else {
  console.log('❌ ANON key is missing');
}

// Check SERVICE ROLE key
console.log('\n2. SERVICE ROLE Key Analysis:');
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const serviceDecoded = decodeJWT(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceDecoded.error) {
    console.log('❌ SERVICE ROLE key decode error:', serviceDecoded.error);
  } else {
    console.log('✅ SERVICE ROLE key decoded successfully');
    console.log('   Header:', JSON.stringify(serviceDecoded.header, null, 2));
    console.log('   Payload:', JSON.stringify(serviceDecoded.payload, null, 2));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (serviceDecoded.payload.exp && serviceDecoded.payload.exp < now) {
      console.log('❌ SERVICE ROLE key is EXPIRED');
    } else {
      console.log('✅ SERVICE ROLE key is not expired');
    }
  }
} else {
  console.log('❌ SERVICE ROLE key is missing');
}

// Check if the keys match the expected URL
console.log('\n3. URL and Key Consistency Check:');
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = url.replace('https://', '').replace('.supabase.co', '');
  console.log('URL:', url);
  console.log('Expected Project Ref:', projectRef);
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const anonDecoded = decodeJWT(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (!anonDecoded.error && anonDecoded.payload && anonDecoded.payload.ref) {
      if (anonDecoded.payload.ref === projectRef) {
        console.log('✅ ANON key matches URL project ref');
      } else {
        console.log('❌ ANON key project ref mismatch:');
        console.log('   Expected:', projectRef);
        console.log('   Actual:', anonDecoded.payload.ref);
      }
    }
  }
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serviceDecoded = decodeJWT(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!serviceDecoded.error && serviceDecoded.payload && serviceDecoded.payload.ref) {
      if (serviceDecoded.payload.ref === projectRef) {
        console.log('✅ SERVICE ROLE key matches URL project ref');
      } else {
        console.log('❌ SERVICE ROLE key project ref mismatch:');
        console.log('   Expected:', projectRef);
        console.log('   Actual:', serviceDecoded.payload.ref);
      }
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('JWT ANALYSIS COMPLETE');
console.log('='.repeat(80));