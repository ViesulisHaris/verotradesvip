'use client';

import { useState } from 'react';
import { supabase } from '../../../../supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    });
    if (error) alert(error.message);
    else {
      alert('Check your email for confirmation!');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-4">
      <div className="glass w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-white">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="metallic-input w-full"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="metallic-input w-full"
            minLength={6}
            required
          />
          <button type="submit" className="w-full py-3 bg-white/20 text-white rounded-xl hover:bg-white/30">
            Register
          </button>
        </form>
        <p className="text-center text-white/80">
          Have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
