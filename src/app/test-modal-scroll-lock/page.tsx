'use client';

import { useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function TestModalScrollLock() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Test the hook directly
  useBodyScrollLock(isModalOpen);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Modal Scroll Lock Test</h1>
      
      <div className="space-y-4 mb-8">
        <p className="text-gray-300">
          This page tests the body scroll lock functionality. When you open the modal, 
          the background should not be scrollable, but the modal content should be scrollable if it overflows.
        </p>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Test Modal
        </button>
      </div>

      {/* Create a long scrolling content to test background scrolling */}
      <div className="space-y-4">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Scrollable Content Item {i + 1}</h3>
            <p className="text-gray-400">
              This is content that should be scrollable when the modal is closed. 
              When the modal is open, you should not be able to scroll this content.
            </p>
          </div>
        ))}
      </div>

      {/* Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-600">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Test Modal</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                This modal should be scrollable if the content overflows, but the background should not scroll.
              </p>
              
              {/* Add enough content to make the modal scrollable */}
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="p-4 bg-gray-700 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2">Modal Content Item {i + 1}</h4>
                  <p className="text-gray-400">
                    This content should be scrollable within the modal. The background page should not scroll when this modal is open.
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}