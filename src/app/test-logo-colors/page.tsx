'use client';

import Logo from '@/components/Logo';

export default function TestLogoColors() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--deep-charcoal)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--warm-off-white)' }}>Logo Color Test</h1>
        
        <div className="space-y-8">
          <div className="glass p-6 rounded-xl border border-dusty-gold/20">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--dusty-gold)' }}>Logo Size Variations</h2>
            
            <div className="flex flex-wrap gap-8 items-center">
              <div className="text-center">
                <Logo size="small" />
                <p className="mt-2 text-sm" style={{ color: 'var(--warm-off-white)', opacity: 0.6 }}>Small</p>
              </div>
              
              <div className="text-center">
                <Logo size="medium" />
                <p className="mt-2 text-sm" style={{ color: 'var(--warm-off-white)', opacity: 0.6 }}>Medium</p>
              </div>
              
              <div className="text-center">
                <Logo size="large" />
                <p className="mt-2 text-sm" style={{ color: 'var(--warm-off-white)', opacity: 0.6 }}>Large</p>
              </div>
            </div>
          </div>
          
          <div className="glass p-6 rounded-xl border border-dusty-gold/20">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--dusty-gold)' }}>Logo with Different Backgrounds</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--warm-sand)' }}>
                <Logo size="medium" />
                <p className="mt-2 text-sm" style={{ color: 'var(--deep-charcoal)' }}>Warm Sand Background</p>
              </div>
              
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--soft-graphite)' }}>
                <Logo size="medium" />
                <p className="mt-2 text-sm" style={{ color: 'var(--warm-off-white)' }}>Soft Graphite Background</p>
              </div>
              
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--deep-charcoal)' }}>
                <Logo size="medium" />
                <p className="mt-2 text-sm" style={{ color: 'var(--warm-off-white)' }}>Deep Charcoal Background</p>
              </div>
            </div>
          </div>
          
          <div className="glass p-6 rounded-xl border border-dusty-gold/20">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--dusty-gold)' }}>Expected Color Scheme</h2>
            <div className="space-y-2" style={{ color: 'var(--warm-off-white)', opacity: 0.8 }}>
              <p>✅ <strong>Primary Color:</strong> Dusty Gold (transformed from original with warm filter)</p>
              <p>✅ <strong>Text Color:</strong> Warm Off-White for readability</p>
              <p>✅ <strong>Filter Applied:</strong> hue-rotate(25deg) saturate(1.5) brightness(1.1) contrast(1.1) sepia(1)</p>
              <p>✅ <strong>Background Compatibility:</strong> Works on both soft graphite and deep charcoal backgrounds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}