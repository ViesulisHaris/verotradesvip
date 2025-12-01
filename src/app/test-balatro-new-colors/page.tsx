"use client";

import { useEffect } from "react";
import Balatro from "@/components/Balatro";

export default function TestBalatroNewColors() {
  useEffect(() => {
    console.log('[TEST] Testing new Balatro colors and movement pattern');
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Balatro background */}
      <Balatro isRotate={true} mouseInteraction={true} pixelFilter={700} />
      
      {/* Test content with glass morphism styling */}
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Glass morphism card */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-4">
              Balatro Background Test
            </h1>
            <p className="text-white/80 text-lg">
              Testing the new Balatro background with:
            </p>
            <ul className="text-white/70 mt-4 space-y-2">
              <li>• New darker colors: #1A2F1A (dark forest green), #1A1A3A (dark blue), #2D0B0B (dark red)</li>
              <li>• Further reduced blur effect intensity (0.5)</li>
              <li>• Flowing wave movement pattern</li>
              <li>• Glass morphism UI integration</li>
            </ul>
          </div>

          {/* Multiple glass cards to test visual hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-3">Color Test</h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#1A2F1A' }}></div>
                  <span className="text-white/70">#1A2F1A - Dark Forest Green</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#1A1A3A' }}></div>
                  <span className="text-white/70">#1A1A3A - Dark Blue</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#2D0B0B' }}></div>
                  <span className="text-white/70">#2D0B0B - Dark Red</span>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-3">Movement Test</h2>
              <p className="text-white/70">
                Observe the subtle flowing wave motion in the background. 
                The movement should be smooth and not interfere with readability.
              </p>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-3">Blur Test</h2>
              <p className="text-white/70">
                The blur effect should be reduced compared to the previous version, 
                providing better clarity while maintaining the aesthetic.
              </p>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-3">Interaction Test</h2>
              <p className="text-white/70">
                Move your mouse to see the interactive gradient effect. 
                The colors should follow your cursor movement.
              </p>
            </div>
          </div>

          {/* Test buttons with glass morphism */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition-all duration-300">
              Test Button 1
            </button>
            <button className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition-all duration-300">
              Test Button 2
            </button>
            <button className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition-all duration-300">
              Test Button 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}