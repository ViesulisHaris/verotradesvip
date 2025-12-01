'use client';

interface StrategyRuleCheckboxesProps {
  rules: string[];
}

export default function StrategyRuleCheckboxes({
  rules
}: StrategyRuleCheckboxesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Strategy Rules</h3>
      {rules.map((rule, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
          <div className="text-sm text-gray-300 leading-relaxed">
            {rule}
          </div>
        </div>
      ))}
    </div>
  );
}