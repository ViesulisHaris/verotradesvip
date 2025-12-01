const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createSimpleTestStrategies() {
  try {
    console.log('Creating test strategies...');
    
    // First, authenticate as the test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('Authentication failed:', authError.message);
      return;
    }
    
    console.log('Authenticated as:', authData.user.email);
    
    // Create test strategies
    const testStrategies = [
      { name: 'Momentum Trading', description: 'Buy stocks with upward price momentum', is_active: true },
      { name: 'Value Investing', description: 'Buy undervalued stocks for long-term growth', is_active: true },
      { name: 'Day Trading', description: 'Buy and sell stocks within the same trading day', is_active: true }
    ];
    
    for (const strategy of testStrategies) {
      const { data, error } = await supabase
        .from('strategies')
        .insert({ ...strategy, user_id: authData.user.id })
        .select();
      
      if (error) {
        console.error('Error creating strategy:', error.message);
      } else {
        console.log('Created strategy:', data[0].name, '(ID:', data[0].id, ')');
      }
    }
    
    // Verify strategies were created
    const { data: strategies, error: fetchError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('is_active', true);
    
    if (fetchError) {
      console.error('Error fetching strategies:', fetchError.message);
    } else {
      console.log('\nTotal active strategies:', strategies.length);
      strategies.forEach(s => console.log('- ', s.name, '(ID:', s.id, ')'));
    }
    
    console.log('\nTest strategies created successfully!');
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

createSimpleTestStrategies();