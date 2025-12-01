// Debug script to understand what's happening with our test
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'RELATIONSHIP_REBUILD.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Debugging RELATIONSHIP_REBUILD.sql...\n');

// Split into lines and analyze
const lines = sqlContent.split('\n');
let inCreateTable = false;
let foundVariableDeclaration = false;
let foundLine = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track if we're in a CREATE TABLE statement
    if (line.startsWith('CREATE TABLE') || line.startsWith('CREATE TEMP TABLE')) {
        inCreateTable = true;
        console.log(`Line ${i+1}: Entering CREATE TABLE mode: ${line}`);
    } else if (inCreateTable && line.includes(');')) {
        inCreateTable = false;
        console.log(`Line ${i+1}: Exiting CREATE TABLE mode: ${line}`);
    }
    
    // Check for variable declaration only when not in CREATE TABLE
    if (!inCreateTable && line.match(/constraint_name\s+TEXT;/)) {
        foundVariableDeclaration = true;
        foundLine = i + 1;
        console.log(`Line ${foundLine}: Found constraint_name TEXT declaration: ${line}`);
        break;
    }
    
    // Also check for v_constraint_name
    if (line.match(/v_constraint_name\s+TEXT;/)) {
        console.log(`Line ${i+1}: Found v_constraint_name TEXT declaration: ${line}`);
    }
}

console.log(`\nFound variable declaration: ${foundVariableDeclaration}`);
if (foundVariableDeclaration) {
    console.log(`At line: ${foundLine}`);
}

// Let's also check all constraint_name occurrences with word boundaries
console.log('\nAll constraint_name occurrences (word boundaries):');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/\bconstraint_name\b/)) {
        console.log(`Line ${i+1}: ${lines[i].trim()}`);
    }
}

// Count them
const constraintNameCount = sqlContent.match(/\bconstraint_name\b/g) || [];
console.log(`\nTotal count: ${constraintNameCount.length}`);