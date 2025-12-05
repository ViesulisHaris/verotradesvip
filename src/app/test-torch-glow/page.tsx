'use client';

import React from 'react';
import TorchGlowContainer, { SimpleTorchGlow, StrongTorchGlow } from '@/components/TorchGlowContainer';

export default function TestTorchGlow() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-white text-2xl mb-8">Torch Glow Effect Test</h1>
      
      <div className="space-y-8">
        {/* Test 1: Basic TorchGlowContainer */}
        <div>
          <h2 className="text-white mb-4">Basic TorchGlowContainer (hoverOnly=false)</h2>
          <TorchGlowContainer className="p-8">
            <div className="text-white">
              <p>This should always show the torch glow effect.</p>
              <p>Move your mouse over this area to see the glow follow your cursor.</p>
            </div>
          </TorchGlowContainer>
        </div>

        {/* Test 2: SimpleTorchGlow */}
        <div>
          <h2 className="text-white mb-4">SimpleTorchGlow (hoverOnly=true)</h2>
          <SimpleTorchGlow className="p-8">
            <div className="text-white">
              <p>This should show the torch glow effect only on hover.</p>
              <p>Move your mouse over this area to see the glow appear.</p>
            </div>
          </SimpleTorchGlow>
        </div>

        {/* Test 3: StrongTorchGlow */}
        <div>
          <h2 className="text-white mb-4">StrongTorchGlow (hoverOnly=false, strong intensity)</h2>
          <StrongTorchGlow className="p-8">
            <div className="text-white">
              <p>This should show a strong torch glow effect.</p>
              <p>Move your mouse over this area to see the strong glow follow your cursor.</p>
            </div>
          </StrongTorchGlow>
        </div>

        {/* Test 4: Custom Configuration */}
        <div>
          <h2 className="text-white mb-4">Custom Configuration (subtle intensity, hoverOnly=true)</h2>
          <TorchGlowContainer 
            className="p-8"
            intensity="subtle"
            hoverOnly={true}
            glowSize="large"
          >
            <div className="text-white">
              <p>This should show a subtle torch glow effect only on hover.</p>
              <p>Move your mouse over this area to see the subtle glow appear.</p>
            </div>
          </TorchGlowContainer>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h3 className="text-white mb-2">Debug Instructions:</h3>
        <ul className="text-gray-300 space-y-1">
          <li>Open browser console to see debug logs</li>
          <li>Move mouse over each container to test the effect</li>
          <li>Check if reddish-orange glow appears around container edges</li>
          <li>Verify glow follows mouse movement</li>
        </ul>
      </div>
    </div>
  );
}