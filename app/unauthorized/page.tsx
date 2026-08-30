export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-4 text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 Forbidden</h1>
      <p className="text-lg text-gray-600">You do not have permission to view this page.</p>
      <a href="/" className="mt-8 text-blue-600 hover:underline">Return to Home</a>
    </div>
  );
}
