'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Map error codes to user-friendly messages
const errorMessages: Record<string, string> = {
  'Configuration': 'There was a problem with the authentication configuration. Please try again later.',
  'AccessDenied': 'Access denied. You do not have permission to access this resource.',
  'Verification': 'The verification link may have expired or already been used.',
  'OAuthSignin': 'There was a problem signing in with the authentication provider.',
  'OAuthCallback': 'There was a problem with the authentication callback.',
  'OAuthCreateAccount': 'Could not create an account with the authentication provider.',
  'EmailCreateAccount': 'Could not create an account with the provided email.',
  'Callback': 'There was a problem with the authentication callback.',
  'OAuthAccountNotLinked': 'To confirm your identity, sign in with the same account you used originally.',
  'EmailSignin': 'The e-mail could not be sent.',
  'CredentialsSignin': 'The credentials you provided were invalid.',
  'SessionRequired': 'Authentication required. Please sign in to access this page.',
  'Default': 'An unknown authentication error occurred.'
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get the error code from the URL
    const errorCode = searchParams?.get('error') || 'Default';
    setErrorMessage(errorMessages[errorCode] || errorMessages.Default);
  }, [searchParams]);

  // Return a placeholder with the same structure until client-side code runs
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Authentication Error</h1>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <p className="text-gray-700 mb-4">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-2">Authentication Error</h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <p className="text-gray-700 mb-4">{errorMessage}</p>
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support for assistance.
          </p>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
} 