@echo off
setlocal enabledelayedexpansion

:: Test script for deletion functionality using curl
:: This script tests the /api/generate-test-data endpoint with delete-all action

set API_URL=http://localhost:3000/api/generate-test-data
set RESULTS_FILE=deletion-test-results.json

:: Initialize counters
set total=0
set passed=0
set failed=0

:: Create initial results file
echo { > %RESULTS_FILE%
echo   "timestamp": "%date:~6,4%-%date:~3,2%-%date:~0,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%.000Z", >> %RESULTS_FILE%
echo   "tests": [], >> %RESULTS_FILE%
echo   "summary": { >> %RESULTS_FILE%
echo     "total": 0, >> %RESULTS_FILE%
echo     "passed": 0, >> %RESULTS_FILE%
echo     "failed": 0 >> %RESULTS_FILE%
echo   } >> %RESULTS_FILE%
echo } >> %RESULTS_FILE%

echo.
echo 🚀 Starting Deletion Functionality Tests with curl
echo ==================================================
echo.

:: Function to run a test (simulated with goto labels)
:run_test
set test_name=%~1
set expected_status=%~2
set curl_options=%~3
set test_description=%~4

echo 🔍 Testing: %test_name%
echo    Description: %test_description%

:: Make the request and capture response
curl -s -w "%%{http_code}" %curl_options% "%API_URL%" > temp_response.txt 2>nul
for /f "delims=" %%i in (temp_response.txt) do set response=%%i

:: Extract HTTP code (last line)
for /f "tokens=* delims=" %%a in ("%response%") do set http_code=%%a

:: Extract body (everything except last line)
set body=%response%
set body=%body:~0,-3%

:: Check if the test passed
if "%http_code%"=="%expected_status%" (
    echo ✅ PASSED: HTTP %http_code% ^(expected %expected_status%^)
    set status=PASS
    set /a passed+=1
) else (
    echo ❌ FAILED: HTTP %http_code% ^(expected %expected_status%^)
    set status=FAIL
    set /a failed+=1
)

echo    Response: %body%
echo.

:: Increment total
set /a total+=1

:: Clean up
del temp_response.txt 2>nul
goto :eof

:: Test 1: Unauthenticated deletion request
call :run_test "Unauthenticated Deletion" "401" "-X POST -H \"Content-Type: application/json\" -d \"{\\\"action\\\":\\\"delete-all\\\"}\"" "Should reject unauthenticated requests with 401"

:: Test 2: Invalid authentication token
call :run_test "Invalid Token Deletion" "401" "-X POST -H \"Content-Type: application/json\" -H \"Authorization: Bearer invalid-token\" -d \"{\\\"action\\\":\\\"delete-all\\\"}\"" "Should reject invalid authentication tokens with 401"

:: Test 3: Invalid action
call :run_test "Invalid Action" "400" "-X POST -H \"Content-Type: application/json\" -d \"{\\\"action\\\":\\\"invalid-action\\\"}\"" "Should reject invalid actions with 400"

:: Test 4: Malformed JSON
call :run_test "Malformed JSON" "400" "-X POST -H \"Content-Type: application/json\" -d \"invalid-json{\"" "Should reject malformed JSON with 400"

:: Test 5: Wrong HTTP method
call :run_test "Wrong HTTP Method" "405" "-X GET -H \"Content-Type: application/json\"" "Should reject GET method with 405"

:: Test 6: Missing action parameter
call :run_test "Missing Action" "400" "-X POST -H \"Content-Type: application/json\" -d \"{}\"" "Should reject requests without action parameter"

:: Test 7: Empty request body
call :run_test "Empty Request Body" "400" "-X POST -H \"Content-Type: application/json\" -d \"\"" "Should reject empty request body"

:: Test 8: Test verify-data endpoint
call :run_test "Verify Data Endpoint" "401" "-X POST -H \"Content-Type: application/json\" -d \"{\\\"action\\\":\\\"verify-data\\\"}\"" "Should handle verify-data action (401 without auth is expected)"

:: Print summary
echo ==================================================
echo 📋 TEST SUMMARY
echo ==================================================
echo Total Tests: %total%
echo Passed: %passed%
echo Failed: %failed%
set /a success_rate=(%passed% * 100) / %total%
echo Success Rate: %success_rate%%%
echo.

echo 📊 Test results saved to: %RESULTS_FILE%
echo.

echo 🔍 Manual Test Required:
echo    For authenticated deletion testing, please:
echo    1. Navigate to http://localhost:3000/test-comprehensive-data
echo    2. Log in with valid credentials
echo    3. Click the 'Delete All Data' button
echo    4. Verify the operation succeeds and data is deleted
echo.

:: Exit with appropriate code
if %failed% equ 0 (
    echo 🎉 All automated tests passed!
    exit /b 0
) else (
    echo ⚠️  Some tests failed. Check the results above.
    exit /b 1
)