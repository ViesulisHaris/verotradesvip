'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestFinalAuthPage() {
  const [email, setEmail] = useState('testuser@verotrade.com');
  const [password, setPassword] = useState('TestPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🧪 Final Authentication Test');
    console.log('=============================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Calling supabase.auth.signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('📥 Response received from Supabase');
      console.log(`Error present: ${error ? 'YES' : 'NO'}`);
      console.log(`Data present: ${data ? 'YES' : 'NO'}`);
      
      if (error) {
        console.log(`❌ Login failed: ${error.message}`);
        setError(error.message);
      } else {
        console.log('✅ Login successful!');
        console.log(`User ID: ${data.user?.id}`);
        console.log(`User email: ${data.user?.email}`);
        console.log(`Session: ${data.session ? 'CREATED' : 'NONE'}`);
        
        setSuccess('Login successful! Redirecting to dashboard...');
        
        // Test session immediately
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('📋 Session check after login:', sessionData.session ? 'EXISTS' : 'NONE');
        
        // Redirect after a short delay
        setTimeout(() => {
          console.log('🔄 Redirecting to /dashboard...');
          router.push('/dashboard');
        }, 2000);
      }
    } catch (exception) {
      console.log(`❌ Exception during login: ${exception}`);
      setError(`An unexpected error occurred: ${exception}`);
    } finally {
      setLoading(false);
    }
  };

  const testSession = async () => {
    console.log('🔍 Testing current session...');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log('❌ Session check failed:', error.message);
        setError(`Session check failed: ${error.message}`);
      } else {
        console.log('✅ Session check successful');
        console.log(`Session exists: ${data.session ? 'YES' : 'NO'}`);
        console.log(`User: ${data.session?.user?.email || 'NONE'}`);
        setSuccess(`Session exists: ${data.session ? 'YES' : 'NO'}, User: ${data.session?.user?.email || 'NONE'}`);
      }
    } catch (exception) {
      console.log('❌ Session check exception:', exception);
      setError(`Session check exception: ${exception}`);
    }
  };

  const testLogout = async () => {
    console.log('🔄 Testing logout...');
    try {
      await supabase.auth.signOut();
      console.log('✅ Logout successful');
      setSuccess('Logout successful');
      setError('');
    } catch (exception) {
      console.log('❌ Logout exception:', exception);
      setError(`Logout exception: ${exception}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Final Authentication Test</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test with Valid Credentials</h2>
          <p className="text-gray-400 mb-4">
            Use the test user credentials that were just created:
          </p>
          <div className="bg-gray-700 p-4 rounded mb-4 font-mono text-sm">
            <div>Email: testuser@verotrade.com</div>
            <div>Password: TestPassword123!</div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                {success}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Testing Authentication...
                </>
              ) : (
                'Test Login'
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Session Management Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testSession}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Current Session
            </button>
            
            <button
              onClick={testLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-4"
            >
              Test Logout
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2 text-sm">
            <p>✅ Check browser console for detailed logs</p>
            <p>✅ If login succeeds, you should be redirected to dashboard</p>
            <p>✅ If login fails, check the error message above</p>
            <p>✅ Session management buttons test auth state</p>
          </div>
        </div>

        <div className="bg-blue-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-2 text-sm">
            <p>1. Test login with the provided credentials</p>
            <p>2. Verify successful redirect to dashboard</p>
            <p>3. Test session persistence</p>
            <p>4. Test logout functionality</p>
            <p>5. Create additional test users if needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}