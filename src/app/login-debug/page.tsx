'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPageDebug() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage]);
    console.log(`[LOGIN DEBUG] ${logMessage}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    addLog('🧪 Login form submitted');
    addLog(`Email: ${email}`);
    addLog(`Password length: ${password.length}`);
    
    try {
      addLog('🔄 Calling supabase.auth.signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      addLog(`📥 Response received from Supabase`);
      addLog(`Error present: ${error ? 'YES' : 'NO'}`);
      addLog(`Data present: ${data ? 'YES' : 'NO'}`);
      
      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
        addLog(`Error code: ${error.code}`);
        addLog(`Error details: ${JSON.stringify(error)}`);
        alert(`Login failed: ${error.message}`);
      } else {
        addLog('✅ Login successful!');
        addLog(`User ID: ${data.user?.id}`);
        addLog(`User email: ${data.user?.email}`);
        addLog(`Session: ${data.session ? 'CREATED' : 'NONE'}`);
        
        addLog('🔄 Attempting to redirect to /dashboard...');
        
        // Test if router.push works
        try {
          addLog('Calling router.push("/dashboard")...');
          router.push('/dashboard');
          addLog('✅ Router push called successfully');
        } catch (routerError) {
          addLog(`❌ Router push failed: ${routerError}`);
        }
      }
    } catch (exception) {
      addLog(`❌ Exception during login: ${exception}`);
      addLog(`Exception type: ${typeof exception}`);
      addLog(`Exception details: ${JSON.stringify(exception)}`);
      alert(`Exception during login: ${exception}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const testSupabaseConnection = async () => {
    addLog('🔍 Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('trades').select('count').limit(1);
      
      if (error) {
        addLog(`❌ Connection test failed: ${error.message}`);
      } else {
        addLog('✅ Supabase connection is working');
        addLog(`Test result: ${JSON.stringify(data)}`);
      }
    } catch (exception) {
      addLog(`❌ Exception during connection test: ${exception}`);
    }
  };

  const checkCurrentSession = async () => {
    addLog('🔍 Checking current session...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`❌ Session check failed: ${error.message}`);
      } else {
        addLog(`Current session: ${data.session ? 'ACTIVE' : 'NONE'}`);
        if (data.session?.user) {
          addLog(`Current user: ${data.session.user.email}`);
        }
      }
    } catch (exception) {
      addLog(`❌ Exception during session check: ${exception}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Login Form */}
        <div className="glass p-8 space-y-6 border border-blue-500/20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gradient mb-2">VeroTrade (Debug Mode)</h1>
            <p className="text-white/70">Debug version of login page</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="metallic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="metallic-input w-full"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors duration-200 shadow-lg hover:shadow-blue-500/25 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={testSupabaseConnection}
              className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-colors"
            >
              Test Connection
            </button>
            <button
              type="button"
              onClick={checkCurrentSession}
              className="flex-1 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors"
            >
              Check Session
            </button>
            <button
              type="button"
              onClick={clearLogs}
              className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
            >
              Clear Logs
            </button>
          </div>
          
          <p className="text-center text-white/70">
            No account? <Link href="/register" className="text-blue-400 hover:text-blue-300 underline transition-colors">Create account</Link>
          </p>
        </div>

        {/* Debug Logs */}
        <div className="glass p-6 border border-blue-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Debug Logs</h3>
          <div className="bg-black/50 rounded p-4 h-64 overflow-y-auto font-mono text-xs">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Submit the form or click test buttons to see debug information.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1 text-green-400">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass p-4 border border-blue-500/20">
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
              → Original Login Page
            </Link>
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 underline">
              → Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}