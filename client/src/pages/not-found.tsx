import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Show a toast notification when the component mounts
    toast({
      title: 'Page not found',
      description: 'The page you are looking for does not exist.',
      variant: 'warning',
    });
  }, [toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
      <h2 className="mt-4 text-2xl font-bold">Page Not Found</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8">
        <Link to="/">
          <a className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition">
            Go back home
          </a>
        </Link>
      </div>
      
      <div className="mt-8">
        <button
          onClick={() => {
            // Test toast functionality
            toast({
              title: 'Test notification',
              description: 'This is a test of the toast notification system',
              variant: 'success',
            });
          }}
          className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
        >
          Test Toast
        </button>
      </div>
    </div>
  );
}