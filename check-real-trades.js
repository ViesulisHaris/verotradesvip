const { createClient } = require('@supabase/supabase-js');

// Try with service role key to bypass RLS
const supabaseService = createClient(
  'https://bzmixuxautbmqbrqtufx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bWl4dXhhdXRibXFicnF0dWZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MDYzMiwiZXhwIjoyMDc3ODU2NjMyfQ.pCrLqGKMz3YQfMwLGKXQyVtPnLQxO7sJcDqUH8n4Y'
);

async function checkRealTrades() {
  try {
    console.log('Checking for real trades with service role...');
    const { data, error, count } = await supabaseService
      .from('trades')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✅ Real trades found:', {
        count: data?.length || 0,
        sample: data?.slice(0, 2)
      });
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

checkRealTrades();