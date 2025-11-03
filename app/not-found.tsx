import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}

