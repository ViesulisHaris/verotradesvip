#!/bin/bash

# Test script for deletion functionality using curl
# This script tests the /api/generate-test-data endpoint with delete-all action

API_URL="http://localhost:3000/api/generate-test-data"
RESULTS_FILE="deletion-test-results.json"

# Initialize results JSON
echo '{
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "tests": [],
  "summary": {
    "total": 0,
    "passed": 0,
    "failed": 0
  }
}' > $RESULTS_FILE

# Helper function to run a test
run_test() {
  local test_name="$1"
  local expected_status="$2"
  local curl_options="$3"
  local test_description="$4"
  
  echo "🔍 Testing: $test_name"
  echo "   Description: $test_description"
  
  # Make the request and capture response
  response=$(curl -s -w "\n%{http_code}" $curl_options "$API_URL" 2>/dev/null)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)
  
  # Check if the test passed
  if [ "$http_code" = "$expected_status" ]; then
    echo "✅ PASSED: HTTP $http_code (expected $expected_status)"
    status="PASS"
    ((passed++))
  else
    echo "❌ FAILED: HTTP $http_code (expected $expected_status)"
    status="FAIL"
    ((failed++))
  fi
  
  echo "   Response: $body"
  echo ""
  
  # Add to results JSON
  jq --arg name "$test_name" \
     --arg status "$status" \
     --arg description "$test_description" \
     --arg http_code "$http_code" \
     --arg expected_status "$expected_status" \
     --arg body "$body" \
     --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" \
     '.tests += [{
       "name": $name,
       "status": $status,
       "description": $description,
       "http_code": $http_code,
       "expected_status": $expected_status,
       "response": $body,
       "timestamp": $timestamp
     }] | .summary.total += 1 | 
     if $status == "PASS" then .summary.passed += 1 else .summary.failed += 1 end' \
     $RESULTS_FILE > tmp.$$.json && mv tmp.$$.json $RESULTS_FILE
  
  ((total++))
}

# Initialize counters
total=0
passed=0
failed=0

echo "🚀 Starting Deletion Functionality Tests with curl"
echo "=================================================="
echo ""

# Test 1: Unauthenticated deletion request
run_test "Unauthenticated Deletion" \
  "401" \
  "-X POST -H 'Content-Type: application/json' -d '{\"action\":\"delete-all\"}'" \
  "Should reject unauthenticated requests with 401"

# Test 2: Invalid authentication token
run_test "Invalid Token Deletion" \
  "401" \
  "-X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer invalid-token' -d '{\"action\":\"delete-all\"}'" \
  "Should reject invalid authentication tokens with 401"

# Test 3: Invalid action
run_test "Invalid Action" \
  "400" \
  "-X POST -H 'Content-Type: application/json' -d '{\"action\":\"invalid-action\"}'" \
  "Should reject invalid actions with 400"

# Test 4: Malformed JSON
run_test "Malformed JSON" \
  "400" \
  "-X POST -H 'Content-Type: application/json' -d 'invalid-json{' " \
  "Should reject malformed JSON with 400"

# Test 5: Wrong HTTP method
run_test "Wrong HTTP Method" \
  "405" \
  "-X GET -H 'Content-Type: application/json'" \
  "Should reject GET method with 405"

# Test 6: Missing action parameter
run_test "Missing Action" \
  "400" \
  "-X POST -H 'Content-Type: application/json' -d '{}'" \
  "Should reject requests without action parameter"

# Test 7: Empty request body
run_test "Empty Request Body" \
  "400" \
  "-X POST -H 'Content-Type: application/json' -d ''" \
  "Should reject empty request body"

# Test 8: Test verify-data endpoint (should work with or without auth)
run_test "Verify Data Endpoint" \
  "401" \
  "-X POST -H 'Content-Type: application/json' -d '{\"action\":\"verify-data\"}'" \
  "Should handle verify-data action (401 without auth is expected)"

# Print summary
echo "=================================================="
echo "📋 TEST SUMMARY"
echo "=================================================="
echo "Total Tests: $total"
echo "Passed: $passed"
echo "Failed: $failed"
echo "Success Rate: $(( (passed * 100) / total ))%"
echo ""

# Add final summary to results JSON
jq --arg total "$total" \
   --arg passed "$passed" \
   --arg failed "$failed" \
   --arg success_rate "$(( (passed * 100) / total ))" \
   '.summary.total = ($total | tonumber) |
    .summary.passed = ($passed | tonumber) |
    .summary.failed = ($failed | tonumber) |
    .summary.success_rate = ($success_rate | tonumber)' \
   $RESULTS_FILE > tmp.$$.json && mv tmp.$$.json $RESULTS_FILE

echo "📊 Test results saved to: $RESULTS_FILE"
echo ""

# Print failed tests if any
if [ $failed -gt 0 ]; then
  echo "❌ Failed Tests:"
  jq -r '.tests[] | select(.status == "FAIL") | "   - \(.name): \(.description)"' $RESULTS_FILE
  echo ""
fi

echo "🔍 Manual Test Required:"
echo "   For authenticated deletion testing, please:"
echo "   1. Navigate to http://localhost:3000/test-comprehensive-data"
echo "   2. Log in with valid credentials"
echo "   3. Click the 'Delete All Data' button"
echo "   4. Verify the operation succeeds and data is deleted"
echo ""

# Exit with appropriate code
if [ $failed -eq 0 ]; then
  echo "🎉 All automated tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Check the results above."
  exit 1
fi