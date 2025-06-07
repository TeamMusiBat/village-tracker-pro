import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export function Toaster() {
  const { toasts, dismissToast } = useToast();
  
  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col items-end gap-2 p-4 md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
  };
  onDismiss: () => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect to fade in when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Get background color based on variant
  const getBackgroundColor = () => {
    switch (toast.variant) {
      case 'destructive':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div 
      className={`
        ${getBackgroundColor()} 
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} 
        transform rounded-lg shadow-lg transition-all duration-300 ease-in-out
        flex w-full max-w-md items-start gap-3 p-4
      `}
      role="alert"
    >
      <div className="flex-1">
        <h3 className="font-medium">{toast.title}</h3>
        {toast.description && (
          <div className="mt-1 text-sm opacity-90">{toast.description}</div>
        )}
      </div>
      
      <button
        onClick={onDismiss}
        className="ml-auto -mt-1 -mr-1 h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Close toast"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}

export default Toaster;