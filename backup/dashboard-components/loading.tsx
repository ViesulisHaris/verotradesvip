'use client';

export default function Loading() {
  return (
    <div className="space-y-8 p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-6 rounded-xl">
              <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>
        <div className="glass p-6 rounded-xl mt-8">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}