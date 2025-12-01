export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-primary text-white p-section">
      <h1 className="text-2xl font-bold mb-component">Simple Test Page</h1>
      <p className="mb-component">This is a minimal test page that bypasses authentication.</p>
      <div className="bg-card p-card-inner rounded-lg">
        <h2 className="text-xl font-semibold mb-element">Test Content</h2>
        <p>If you can see this, the basic Next.js setup is working.</p>
      </div>
    </div>
  );
}