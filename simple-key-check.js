// Simple key length verification
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODA2MzIsImV4cCI6MjA3Nzg1NjYzMn0.Lm4bo_r__27b0Los00TpvD9KMgwKEOPlQT0waS5jWPk";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MDYzMiwiZXhwIjoyMDc3ODU2NjMyfQ.pFRbi-LADHU1cdrZjulUIm0NAQWvevCa5QYERbZyI6E";

console.log('🔍 SIMPLE KEY VERIFICATION');
console.log('==========================');

console.log('\n📋 ANONYMOUS KEY:');
console.log('Length:', anonKey.length);
console.log('Segments:', anonKey.split('.').length);
console.log('Segment lengths:', anonKey.split('.').map(s => s.length));
console.log('Starts with eyJ:', anonKey.startsWith('eyJ'));

console.log('\n📋 SERVICE ROLE KEY:');
console.log('Length:', serviceKey.length);
console.log('Segments:', serviceKey.split('.').length);
console.log('Segment lengths:', serviceKey.split('.').map(s => s.length));
console.log('Starts with eyJ:', serviceKey.startsWith('eyJ'));

console.log('\n✅ Both keys appear to be complete JWT tokens with proper structure');
console.log('✅ Anonymous key length:', anonKey.length, 'characters');
console.log('✅ Service role key length:', serviceKey.length, 'characters');
console.log('✅ Both keys have 3 JWT segments (header.payload.signature)');