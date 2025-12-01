// Fix Import Paths Script
// This script will fix all relative Supabase client imports to use absolute imports

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING SUPABASE IMPORT PATHS');
console.log('==================================\n');

// Files that need to be fixed
const filesToFix = [
  {
    file: 'src/app/calendar/page.tsx',
    oldImport: '../../../supabase/client',
    newImport: '@/supabase/client'
  },
  {
    file: 'src/app/strategies/create/page.tsx', 
    oldImport: '../../../../supabase/client',
    newImport: '@/supabase/client'
  },
  {
    file: 'src/components/StrategyCard.tsx',
    oldImport: '../../supabase/client', 
    newImport: '@/supabase/client'
  }
];

let fixedCount = 0;

filesToFix.forEach(({ file, oldImport, newImport }) => {
  console.log(`Processing: ${file}`);
  
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const oldRegex = new RegExp(`from\\s+['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    
    if (oldRegex.test(content)) {
      const newContent = content.replace(oldRegex, `from '${newImport}'`);
      
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Fixed: ${oldImport} → ${newImport}`);
      fixedCount++;
    } else {
      console.log(`⚠️  No matching import found in ${file}`);
    }
  } else {
    console.log(`❌ File not found: ${file}`);
  }
  
  console.log('');
});

console.log(`\n📊 SUMMARY:`);
console.log(`Files processed: ${filesToFix.length}`);
console.log(`Files fixed: ${fixedCount}`);
console.log(`Files with issues: ${filesToFix.length - fixedCount}`);

if (fixedCount === filesToFix.length) {
  console.log('\n✅ ALL IMPORT PATHS FIXED SUCCESSFULLY!');
} else {
  console.log('\n⚠️  SOME FILES HAD ISSUES');
}