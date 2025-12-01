'use client';

import { useState } from 'react';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function TestDropdownPositioning() {
  const [selectedValue, setSelectedValue] = useState('');

  const options = [
    { value: 'option1', label: 'Option 1 - This is a longer text to test spacing' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3 - Another long option text' },
    { value: 'option4', label: 'Option 4' },
    { value: 'option5', label: 'Option 5 - Testing the icon positioning' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Dropdown Icon Positioning Test</h1>
        
        <div className="space-y-6">
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Custom Dropdown with Improved Icon Positioning</h2>
            <p className="text-white/70 mb-4">
              The dropdown icon should now be positioned more to the side with better spacing between the text and icon.
            </p>
            
            <label className="block text-sm font-medium text-white/70 mb-2">Select an Option:</label>
            <CustomDropdown
              value={selectedValue}
              onChange={setSelectedValue}
              options={options}
              placeholder="Choose an option to test positioning"
            />
            
            {selectedValue && (
              <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-white">Selected: {selectedValue}</p>
              </div>
            )}
          </div>

          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Visual Comparison</h2>
            <p className="text-white/70 mb-4">
              The icon should have more space between it and the text, making it visually more pleasing.
            </p>
            <ul className="text-white/70 space-y-2">
              <li>• Increased right padding from pr-12 to pr-16</li>
              <li>• Added ml-2 margin to the ChevronDown icon</li>
              <li>• Responsive adjustments for mobile devices</li>
              <li>• Maintains all existing functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}