'use client';

import { useState } from 'react';
import { supabase } from '../../../../supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateStrategyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [rules, setRules] = useState<string[]>(['']);

  const addRule = () => setRules([...rules, '']);
  const updateRule = (i: number, v: string) => setRules(rules.map((r, j) => j === i ? v : r));
  const removeRule = (i: number) => setRules(rules.filter((_, j) => j !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cleanRules = rules.filter(r => r.trim());

    const { error } = await supabase.from('strategies').insert({
      user_id: user.id,
      name,
      rules: cleanRules,
    });

    if (error) alert(error.message);
    else router.push('/strategies');
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Link href="/strategies" className="text-white mb-4 inline-block">&larr; Back</Link>
      <h2 className="text-3xl font-bold mb-6 text-white">Create Strategy</h2>
      <form onSubmit={handleSubmit} className="glass p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="metallic-input w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Rules</label>
          {rules.map((r, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={r}
                onChange={(e) => updateRule(i, e.target.value)}
                placeholder="e.g. Only London session"
                className="flex-1 metallic-input"
              />
              {rules.length > 1 && (
                <button type="button" onClick={() => removeRule(i)} className="px-2 text-red-400">
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRule} className="text-primary hover:underline">
            + Add rule
          </button>
        </div>
        <button type="submit" className="w-full py-3 bg-white/20 text-white rounded-xl hover:bg-white/30">
          Create
        </button>
      </form>
    </div>
  );
}
