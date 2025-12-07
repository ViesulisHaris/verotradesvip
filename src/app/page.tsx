export default function HomePage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Home Page</h1>
      <p>This is a simple home page to test routing.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
}