'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function DebugLoginPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG LOGIN] ${message}`);
  };

  useEffect(() => {
    addLog('Debug login page loaded');
    checkSupabaseConfig();
    checkCurrentSession();
  }, []);

  const checkSupabaseConfig = () => {
    addLog('Checking Supabase configuration...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    addLog(`Supabase URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
    addLog(`Supabase Anon Key: ${supabaseAnonKey ? 'SET' : 'MISSING'}`);
    
    if (supabaseUrl && supabaseAnonKey) {
      addLog('✅ Supabase environment variables are configured');
    } else {
      addLog('❌ Supabase environment variables are missing');
    }
    
    // Check Supabase client
    try {
      addLog(`Supabase client created: ${supabase ? 'YES' : 'NO'}`);
      addLog(`Supabase client initialized successfully`);
    } catch (error) {
      addLog(`❌ Error creating Supabase client: ${error}`);
    }
  };

  const checkCurrentSession = async () => {
    addLog('Checking current session...');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`❌ Error getting session: ${error.message}`);
      } else {
        addLog(`Current session: ${data.session ? 'ACTIVE' : 'NONE'}`);
        if (data.session?.user) {
          addLog(`Current user: ${data.session.user.email}`);
        }
      }
    } catch (error) {
      addLog(`❌ Exception checking session: ${error}`);
    }
  };

  const testDirectLogin = async () => {
    setLoading(true);
    addLog(`🧪 Testing direct login with email: ${email}`);
    
    try {
      addLog('Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
        addLog(`Error details: ${JSON.stringify(error)}`);
      } else {
        addLog('✅ Login successful!');
        addLog(`User ID: ${data.user?.id}`);
        addLog(`User email: ${data.user?.email}`);
        addLog(`Session: ${data.session ? 'CREATED' : 'NONE'}`);
      }
    } catch (exception) {
      addLog(`❌ Exception during login: ${exception}`);
    } finally {
      setLoading(false);
    }
  };

  const testFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog('🧪 Testing form submission (simulating login page behavior)');
    
    try {
      // Simulate the exact same logic as the login page
      addLog('Calling supabase.auth.signInWithPassword...');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        addLog(`❌ Form submission failed: ${error.message}`);
        alert(error.message);
      } else {
        addLog('✅ Form submission successful!');
        addLog('Attempting to redirect to /dashboard...');
        // router.push('/dashboard');
        addLog('Redirect skipped in debug mode');
      }
    } catch (exception) {
      addLog(`❌ Exception during form submission: ${exception}`);
    } finally {
      setLoading(false);
    }
  };

  const testNetworkRequest = async () => {
    setLoading(true);
    addLog('🧪 Testing network connectivity to Supabase...');
    
    try {
      // Test with a simple health check
      const { data, error } = await supabase.from('trades').select('count').limit(1);
      
      if (error) {
        addLog(`❌ Network test failed: ${error.message}`);
        addLog(`Error code: ${error.code}`);
        addLog(`Error details: ${JSON.stringify(error)}`);
      } else {
        addLog('✅ Network connectivity to Supabase is working');
        addLog(`Test query result: ${JSON.stringify(data)}`);
      }
    } catch (exception) {
      addLog(`❌ Exception during network test: ${exception}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-400">🔍 Login Debug Tool</h1>
        
        {/* Test Form */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-blue-300">Test Login Form</h2>
          <form onSubmit={testFormSubmission} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="testpassword123"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Form Submission'}
            </button>
          </form>
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-blue-300">Individual Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={testDirectLogin}
              disabled={loading}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              Test Direct Login
            </button>
            <button
              onClick={testNetworkRequest}
              disabled={loading}
              className="py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              Test Network
            </button>
            <button
              onClick={checkCurrentSession}
              disabled={loading}
              className="py-2 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              Check Session
            </button>
          </div>
          <button
            onClick={clearLogs}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
          >
            Clear Logs
          </button>
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">Debug Logs</h2>
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a test to see debug information.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="/login" className="block text-blue-400 hover:text-blue-300 underline">
              → Go to Login Page
            </a>
            <a href="/register" className="block text-blue-400 hover:text-blue-300 underline">
              → Go to Register Page
            </a>
            <a href="/dashboard" className="block text-blue-400 hover:text-blue-300 underline">
              → Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}