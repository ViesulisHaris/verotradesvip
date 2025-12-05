# Duration Calculation Test

This test suite verifies the time duration calculation feature on the log trades page. It ensures that the duration between entry and exit times is calculated correctly for various scenarios.

## Test Cases

The test covers the following scenarios:

1. **Same day duration calculation**
   - Entry: 13:00, Exit: 14:10
   - Expected: "1h 10min"

2. **Next day duration calculation**
   - Entry: 13:00, Exit: 12:50
   - Expected: "23h 50min" (next day)

3. **Minutes only duration**
   - Entry: 09:30, Exit: 10:15
   - Expected: "45min"

4. **Zero duration**
   - Entry: 16:00, Exit: 16:00
   - Expected: "0min"

5. **Empty times**
   - Entry: (empty), Exit: (empty)
   - Expected: No duration displayed

6. **Real-time updates**
   - Verifies that duration updates immediately when times change
   - Tests multiple time changes in sequence

## Prerequisites

1. Make sure your application is running on `http://localhost:3000`
2. Install dependencies: `npm install`
3. Ensure Playwright is installed: `npm run playwright:install`

## Running the Tests

### Option 1: Run the test only
```bash
npm run test:duration
```

### Option 2: Generate HTML report after test
```bash
npm run test:duration:report
```

### Option 3: Run test and generate report (recommended)
```bash
npm run test:duration:full
```

## Test Output

After running the tests, you will find:

1. **JSON Report**: `duration-calculation-test-report.json`
   - Machine-readable test results
   - Contains all test details, screenshots paths, and error messages

2. **HTML Report**: `duration-calculation-test-report.html` (generated with report command)
   - Human-readable test results with embedded screenshots
   - Visual representation of test outcomes

3. **Screenshots**: `duration-test-screenshots/` directory
   - Screenshots taken at each step of the testing process
   - Organized by test case and step name

## Test Report Features

The HTML report includes:

- **Summary Section**: Overview of test results with pass/fail counts
- **Detailed Test Results**: Each test case with:
  - Entry and exit times
  - Expected vs actual duration
  - Screenshots for visual verification
  - Error messages (if any)
- **Visual Indicators**: Color-coded pass/fail status
- **Screenshot Gallery**: All screenshots organized by test case

## Troubleshooting

### Test fails to start
1. Ensure your application is running on `http://localhost:3000`
2. Check that you can manually access the log trade page
3. Verify that you have valid login credentials or the page allows anonymous access

### Login issues
The test attempts to login with these credentials:
- Email: `test@example.com`
- Password: `testpassword123`

If these don't work, you may need to:
1. Create a test account with these credentials, or
2. Modify the login function in the test script to use valid credentials

### Screenshots not appearing
1. Ensure the `duration-test-screenshots` directory exists
2. Check file permissions
3. Verify that Playwright has permission to write files

### Time input selectors not working
The test uses these selectors to find time inputs:
- Entry time: `input[type="time"]:has-text("Entry Time")`
- Exit time: `input[type="time"]:has-text("Exit Time")`

If these selectors don't match your actual HTML, you may need to update them in the test script.

## Customization

### Adding new test cases
To add new test cases, modify the `testCases` array in `duration-calculation-test.js`:

```javascript
{
  id: 'your-test-id',
  name: 'Your Test Name',
  entryTime: '13:00',
  exitTime: '14:30',
  expectedDuration: '1h 30min',
  description: 'Description of what this test verifies'
}
```

### Modifying selectors
If your HTML structure changes, update these selectors in the test script:
- Time inputs: `input[type="time"]:has-text("Entry Time")` and `input[type="time"]:has-text("Exit Time")`
- Duration display: `.bg-verotrade-gold-primary\\/10 .text-white.font-medium`

### Changing the base URL
Update the `baseUrl` in the config object at the top of the test script if your application runs on a different URL or port.

## Technical Details

The test script:
- Uses Playwright for browser automation
- Takes screenshots at each step for visual verification
- Generates both JSON and HTML reports
- Handles login automatically if required
- Tests real-time updates by monitoring the duration display as times change
- Includes proper error handling and reporting

## Integration with CI/CD

This test can be integrated into your CI/CD pipeline:

```bash
# Start your application
npm run dev &

# Wait for application to start
sleep 10

# Run the duration calculation tests
npm run test:duration:full

# Check exit code
if [ $? -eq 0 ]; then
  echo "Duration calculation tests passed!"
else
  echo "Duration calculation tests failed!"
  exit 1
fi
```

The test will exit with code 1 if any tests fail, making it suitable for CI/CD integration.