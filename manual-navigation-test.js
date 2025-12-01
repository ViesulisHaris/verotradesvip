const http = require('http');

// List of pages to test
const pagesToTest = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Trades', path: '/trades' },
  { name: 'Log Trade', path: '/log-trade' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Strategies', path: '/strategies' },
  { name: 'Confluence', path: '/confluence' },
  { name: 'Settings', path: '/settings' }
];

console.log('Starting manual navigation test...\n');

// Test each page
pagesToTest.forEach((pageInfo, index) => {
  setTimeout(() => {
    console.log(`Testing ${pageInfo.name} page...`);
    console.log(`Please navigate to http://localhost:3000${pageInfo.path}`);
    console.log('Verify that:');
    console.log('1. The page loads without errors');
    console.log('2. The top navigation bar is visible');
    console.log('3. All navigation links are present in the top bar');
    console.log('4. You can click on any navigation link to go to that page\n');
    
    if (index === pagesToTest.length - 1) {
      console.log('All pages have been listed for testing.');
      console.log('Please test navigation between pages by clicking the navigation links.');
      console.log('Verify that you can navigate from any page to any other page using the top navigation bar.');
    }
  }, index * 2000); // 2 second delay between each page
});

// Instructions for manual testing
console.log('\nManual Navigation Test Instructions:');
console.log('==================================');
console.log('1. Open your browser and navigate to http://localhost:3000');
console.log('2. Log in to the application if required');
console.log('3. For each page listed above, navigate to it and verify the requirements');
console.log('4. Test navigation between pages by clicking the navigation links');
console.log('5. Ensure that the top navigation bar is always visible and functional');
console.log('6. Verify that you can navigate away from each page successfully\n');