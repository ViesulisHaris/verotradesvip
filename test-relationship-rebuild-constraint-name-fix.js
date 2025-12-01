// Test script to verify the constraint_name ambiguous column reference fix in RELATIONSHIP_REBUILD.sql
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'RELATIONSHIP_REBUILD.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Testing RELATIONSHIP_REBUILD.sql for constraint_name ambiguous column reference fixes...\n');

// Check if there's a PL/pgSQL variable declaration with constraint_name (not in a CREATE TABLE statement)
const lines = sqlContent.split('\n');
let foundVariableDeclaration = false;
let inCreateTable = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track if we're in a CREATE TABLE statement
    if (line.startsWith('CREATE TABLE') || line.startsWith('CREATE TEMP TABLE')) {
        inCreateTable = true;
    } else if (inCreateTable && line.includes(');')) {
        inCreateTable = false;
    }
    
    // Check for variable declaration only when not in CREATE TABLE
    // Use word boundaries to avoid matching within v_constraint_name
    if (!inCreateTable && line.match(/\bconstraint_name\s+TEXT;/)) {
        foundVariableDeclaration = true;
        break;
    }
}

if (foundVariableDeclaration) {
    console.error('❌ FAIL: Found undeclared constraint_name variable (should be renamed to v_constraint_name)');
    process.exit(1);
} else {
    console.log('✅ PASS: No undeclared constraint_name variable found');
}

// Check if the variable is properly declared as v_constraint_name
const vVariableDeclarationRegex = /v_constraint_name\s+TEXT;/;
if (!vVariableDeclarationRegex.test(sqlContent)) {
    console.error('❌ FAIL: v_constraint_name variable declaration not found');
    process.exit(1);
} else {
    console.log('✅ PASS: v_constraint_name variable properly declared');
}

// Count different types of constraint_name references
const tableColumnReferences = (sqlContent.match(/\bconstraint_name\b/g) || []).length;
const vConstraintNameReferences = (sqlContent.match(/v_constraint_name/g) || []).length;

// We expect 2 references to constraint_name (table column definition + table column reference in WHERE clause)
// and multiple references to v_constraint_name (the variable)
if (tableColumnReferences !== 2) {
    console.error(`❌ FAIL: Expected 2 references to constraint_name (table column definition + reference), found ${tableColumnReferences}`);
    process.exit(1);
} else {
    console.log('✅ PASS: Correct number of constraint_name references (table column definition + reference)');
}

if (vConstraintNameReferences < 5) {
    console.error(`❌ FAIL: Expected at least 5 references to v_constraint_name (variable), found ${vConstraintNameReferences}`);
    process.exit(1);
} else {
    console.log(`✅ PASS: Found ${vConstraintNameReferences} references to v_constraint_name (variable)`);
}

// Check for the specific line that was causing the error
const problematicLineRegex = /tc\.constraint_name\s*=\s*constraint_name\s*--/;
if (problematicLineRegex.test(sqlContent)) {
    console.error('❌ FAIL: Found the problematic line with ambiguous constraint_name reference');
    process.exit(1);
} else {
    console.log('✅ PASS: No ambiguous constraint_name reference found');
}

// Check that the fixed line exists
const fixedLineRegex = /tc\.constraint_name\s*=\s*v_constraint_name\s*--/;
if (!fixedLineRegex.test(sqlContent)) {
    console.error('❌ FAIL: Fixed line with v_constraint_name reference not found');
    process.exit(1);
} else {
    console.log('✅ PASS: Fixed line with v_constraint_name reference found');
}

console.log('\n🎉 All tests passed! The constraint_name ambiguous column reference error has been fixed.');
console.log('\nSummary of fixes:');
console.log('- Renamed PL/pgSQL variable from constraint_name to v_constraint_name');
console.log('- Updated all references to use the new variable name');
console.log('- Eliminated ambiguity between variable and table column names');