// Simple test to verify the RAISE NOTICE fix in RELATIONSHIP_REBUILD.sql
const fs = require('fs');
const path = require('path');

console.log('Testing RELATIONSHIP_REBUILD.sql fix...');

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'RELATIONSHIP_REBUILD.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Check if the fix is present
const hasFixedDoBlock = sqlContent.includes('-- Final completion notice\nDO $$\nBEGIN\n    RAISE NOTICE');

if (hasFixedDoBlock) {
    console.log('✅ SUCCESS: RAISE NOTICE statements are now properly wrapped in a DO block');
    console.log('✅ The syntax error on line 370 has been fixed');
    console.log('✅ The script should now execute without syntax errors in Supabase/PostgreSQL');
} else {
    console.log('❌ ERROR: Fixed DO block not found');
}

// Check that there are no standalone RAISE NOTICE statements
const lines = sqlContent.split('\n');
let standaloneRaiseNotice = false;
let inDoBlock = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('DO $$')) {
        inDoBlock = true;
    } else if (line.startsWith('END $$;')) {
        inDoBlock = false;
    }
    
    if (line.startsWith('RAISE NOTICE') && !inDoBlock) {
        standaloneRaiseNotice = true;
        console.log(`❌ Found standalone RAISE NOTICE on line ${i + 1}`);
    }
}

if (!standaloneRaiseNotice) {
    console.log('✅ All RAISE NOTICE statements are properly contained within DO blocks');
}

// Summary
if (hasFixedDoBlock && !standaloneRaiseNotice) {
    console.log('\n🎉 RELATIONSHIP_REBUILD.sql has been successfully fixed!');
    console.log('The script should now execute without the "syntax error at or near RAISE" issue.');
} else {
    console.log('\n⚠️ There may still be issues with the script.');
}