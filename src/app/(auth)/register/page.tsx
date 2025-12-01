'use client';

import { useState } from 'react';
import { supabase } from '@/supabase/client';
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
    <div className="verotrade-min-h-screen verotrade-flex verotrade-items-center verotrade-justify-center" style={{ backgroundColor: 'var(--deep-charcoal)' }}>
      <div className="verotrade-w-full verotrade-max-w-md verotrade-p-8 verotrade-space-y-6 glass-morphism verotrade-rounded-xl" style={{ maxWidth: '448px' }}>
        <div className="verotrade-text-center verotrade-mb-section">
          <h1 className="h1-dashboard verotrade-mb-element">Register</h1>
          <p className="body-text verotrade-mb-element" style={{color: 'var(--muted-gray)'}}>Create your trading journal account</p>
        </div>
        <form onSubmit={handleRegister} className="verotrade-gap-form-group verotrade-mb-section">
          <div>
            <label className="label-text verotrade-block verotrade-mb-input-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field verotrade-w-full"
              required
            />
          </div>
          <div>
            <label className="label-text verotrade-block verotrade-mb-input-label">Password</label>
            <input
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field verotrade-w-full"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label-text verotrade-block verotrade-mb-input-label">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              className="input-field verotrade-w-full"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="button-primary verotrade-w-full"
            style={{ minHeight: '44px' }}
          >
            Register
          </button>
        </form>
        <p className="verotrade-text-center body-text" style={{color: 'var(--muted-gray)'}}>
          Have an account? <Link href="/login" style={{color: 'var(--dusty-gold)', textDecoration: 'none', fontWeight: '500'}} className="hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
