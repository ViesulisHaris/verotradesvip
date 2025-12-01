export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
          <div className="h-12 bg-gray-700 rounded mt-6"></div>
        </div>
      </div>
    </div>
  );
}