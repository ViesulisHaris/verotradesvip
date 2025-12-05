// Simple test to verify toast functionality
console.log('🧪 Testing toast functionality...');

// Test 1: Check if ToastContext is properly exported
try {
  const { useToastContext } = require('./src/contexts/ToastContext.tsx');
  console.log('✅ ToastContext is accessible');
} catch (error) {
  console.log('❌ ToastContext error:', error.message);
}

// Test 2: Check if GlobalToastContainer exists
try {
  const fs = require('fs');
  const globalToastPath = './src/components/ui/GlobalToastContainer.tsx';
  if (fs.existsSync(globalToastPath)) {
    console.log('✅ GlobalToastContainer exists');
  } else {
    console.log('❌ GlobalToastContainer missing');
  }
} catch (error) {
  console.log('❌ File system error:', error.message);
}

console.log('🧪 Toast functionality test completed');