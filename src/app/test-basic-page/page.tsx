export default function BasicTestPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-black mb-4">Basic Test Page</h1>
      <p className="text-lg text-gray-700 mb-8">
        If you can see this page, the basic routing and rendering is working correctly.
      </p>
      <div className="bg-blue-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-blue-800 mb-2">Test Information</h2>
        <ul className="list-disc pl-5 text-blue-700">
          <li>Next.js routing is functional</li>
          <li>Basic component rendering works</li>
          <li>Tailwind CSS styles are applied</li>
          <li>No complex dependencies required</li>
        </ul>
      </div>
      <div className="mt-8">
        <a 
          href="/" 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}