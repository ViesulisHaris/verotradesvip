// Simple test to verify the VERIFICATION.sql fix
// This script checks that the verification_results table is not queried after being dropped

const fs = require('fs');
const path = require('path');

// Read the VERIFICATION.sql file
const sqlFilePath = path.join(__dirname, 'VERIFICATION.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Find all occurrences of DROP TABLE verification_results
const dropTableMatches = sqlContent.match(/DROP TABLE IF EXISTS verification_results/g);
console.log(`Found ${dropTableMatches ? dropTableMatches.length : 0} DROP TABLE statements`);

// Find all occurrences of queries to verification_results after the last DROP TABLE
const lastDropIndex = sqlContent.lastIndexOf('DROP TABLE IF EXISTS verification_results');
const contentAfterLastDrop = sqlContent.substring(lastDropIndex);

// Check if there are any queries to verification_results after the last DROP
const queriesAfterDrop = contentAfterLastDrop.match(/FROM verification_results|INTO verification_results/g);

if (queriesAfterDrop) {
    console.error('ERROR: Found queries to verification_results after DROP TABLE:');
    queriesAfterDrop.forEach(query => console.error(`  - ${query}`));
    process.exit(1);
} else {
    console.log('SUCCESS: No queries to verification_results found after DROP TABLE');
}

// Check that the DO block with final counts comes before the DROP TABLE
const finalCountsBlock = sqlContent.indexOf('-- Get the final counts before dropping the table');
const finalDropTable = sqlContent.lastIndexOf('-- Clean up temporary table\r\nDROP TABLE IF EXISTS verification_results');

// If Windows line endings not found, try Unix line endings
if (finalDropTable === -1) {
    const finalDropTableUnix = sqlContent.lastIndexOf('-- Clean up temporary table\nDROP TABLE IF EXISTS verification_results');
    
    // The final counts block should come BEFORE the DROP TABLE
    if (finalCountsBlock < finalDropTableUnix && finalCountsBlock !== -1 && finalDropTableUnix !== -1) {
        console.log('SUCCESS: Final counts DO block comes before DROP TABLE');
    } else {
        console.error('ERROR: Final counts DO block comes after DROP TABLE or one of them is missing');
        console.error(`finalCountsBlock index: ${finalCountsBlock}`);
        console.error(`finalDropTable index: ${finalDropTableUnix}`);
        process.exit(1);
    }
} else {
    // The final counts block should come BEFORE the DROP TABLE
    if (finalCountsBlock < finalDropTable && finalCountsBlock !== -1 && finalDropTable !== -1) {
        console.log('SUCCESS: Final counts DO block comes before DROP TABLE');
    } else {
        console.error('ERROR: Final counts DO block comes after DROP TABLE or one of them is missing');
        console.error(`finalCountsBlock index: ${finalCountsBlock}`);
        console.error(`finalDropTable index: ${finalDropTable}`);
        process.exit(1);
    }
}

// Check that all SELECT queries to verification_results come before DROP TABLE
const selectMatches = sqlContent.match(/SELECT.*FROM verification_results/g);
const lastSelectIndex = selectMatches ? Math.max(...selectMatches.map(match => sqlContent.indexOf(match))) : -1;

if (lastSelectIndex < lastDropIndex) {
    console.log('SUCCESS: All SELECT queries to verification_results come before DROP TABLE');
} else {
    console.error('ERROR: Found SELECT query to verification_results after DROP TABLE');
    process.exit(1);
}

console.log('\nAll checks passed! The VERIFICATION.sql file has been fixed correctly.');