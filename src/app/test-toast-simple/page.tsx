'use client';

import { useToastContext } from '@/contexts/ToastContext';

export default function TestToastSimplePage() {
  const { showSuccess, showError, showWarning, showInfo } = useToastContext();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Toast Test</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => showSuccess('Success!', 'This is a success message')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Show Success
          </button>
          
          <button
            onClick={() => showError('Error!', 'This is an error message')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Show Error
          </button>
          
          <button
            onClick={() => showWarning('Warning!', 'This is a warning message')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Show Warning
          </button>
          
          <button
            onClick={() => showInfo('Info!', 'This is an info message')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Show Info
          </button>
        </div>
      </div>
    </div>
  );
}