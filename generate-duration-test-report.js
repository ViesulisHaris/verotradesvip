const fs = require('fs');
const path = require('path');

// Read the test results
const reportFile = './duration-calculation-test-report.json';

if (!fs.existsSync(reportFile)) {
  console.error('❌ Test report not found. Please run the duration calculation test first.');
  process.exit(1);
}

const testResults = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

// Generate HTML report
const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Duration Calculation Test Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .test-case {
            background: white;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .test-header {
            padding: 20px;
            border-left: 5px solid #ddd;
        }
        .test-header.passed {
            border-left-color: #28a745;
            background-color: #f8fff9;
        }
        .test-header.failed {
            border-left-color: #dc3545;
            background-color: #fff8f8;
        }
        .test-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        .test-description {
            color: #666;
            margin-bottom: 10px;
        }
        .test-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .detail-item {
            padding: 5px 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .test-body {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .error-message {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .screenshots {
            margin-top: 15px;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 10px;
        }
        .screenshot-item {
            text-align: center;
        }
        .screenshot-item img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .screenshot-caption {
            margin-top: 5px;
            font-size: 0.85em;
            color: #666;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-badge.passed {
            background-color: #28a745;
            color: white;
        }
        .status-badge.failed {
            background-color: #dc3545;
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            border-top: 1px solid #eee;
        }
        .timestamp {
            font-family: monospace;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏱️ Duration Calculation Test Report</h1>
        <p>Comprehensive testing of the time duration calculation feature on the log trades page</p>
        <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">${testResults.summary.totalTests}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="value" style="color: #28a745;">${testResults.summary.passed}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="value" style="color: #dc3545;">${testResults.summary.failed}</div>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <div class="value">${Math.round((testResults.summary.passed / testResults.summary.totalTests) * 100)}%</div>
        </div>
        <div class="summary-card">
            <h3>Duration</h3>
            <div class="value">${testResults.summary.duration}ms</div>
        </div>
    </div>

    <div class="test-results">
        ${testResults.tests.map(test => `
            <div class="test-case">
                <div class="test-header ${test.passed ? 'passed' : 'failed'}">
                    <div class="test-title">
                        ${test.name}
                        <span class="status-badge ${test.passed ? 'passed' : 'failed'}">
                            ${test.passed ? '✅ Passed' : '❌ Failed'}
                        </span>
                    </div>
                    <div class="test-description">${test.description}</div>
                    <div class="test-details">
                        <div class="detail-item">
                            <span class="detail-label">Entry Time:</span> ${test.entryTime || '(empty)'}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Exit Time:</span> ${test.exitTime || '(empty)'}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Expected:</span> ${test.expectedDuration || '(no duration)'}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Actual:</span> ${test.actualDuration || '(no duration)'}
                        </div>
                    </div>
                    ${test.error ? `<div class="error-message"><strong>Error:</strong> ${test.error}</div>` : ''}
                </div>
                ${test.screenshots && test.screenshots.length > 0 ? `
                    <div class="test-body">
                        <div class="screenshots">
                            <h4>📸 Screenshots</h4>
                            <div class="screenshot-grid">
                                ${test.screenshots.map((screenshot, index) => {
                                    const screenshotName = path.basename(screenshot);
                                    const stepName = screenshotName.split('-').pop().replace('.png', '');
                                    return `
                                        <div class="screenshot-item">
                                            <img src="${screenshot}" alt="Screenshot ${index + 1}">
                                            <div class="screenshot-caption">Step: ${stepName}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>Test completed on ${new Date(testResults.summary.endTime).toLocaleString()}</p>
        <p>Total execution time: ${testResults.summary.duration} milliseconds</p>
    </div>
</body>
</html>
`;

// Write HTML report
const htmlReportPath = './duration-calculation-test-report.html';
fs.writeFileSync(htmlReportPath, htmlReport);

console.log('✅ HTML report generated successfully!');
console.log(`📄 Report saved to: ${htmlReportPath}`);
console.log('🌐 Open the file in your browser to view the detailed test results.');