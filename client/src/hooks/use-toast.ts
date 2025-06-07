import { useState, useEffect } from 'react';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
}

// Create a singleton to store toasts across components
class ToastManager {
  private static instance: ToastManager;
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toasts: Toast[] = [];

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public addToast(options: ToastOptions): string {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration: options.duration || 5000, // Default 5 seconds
    };

    this.toasts = [...this.toasts, newToast];
    this.notifyListeners();

    // Auto dismiss after duration
    setTimeout(() => {
      this.dismissToast(id);
    }, newToast.duration);

    return id;
  }

  public dismissToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  public getToasts(): Toast[] {
    return [...this.toasts];
  }

  public subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

/**
 * Hook to manage toast notifications
 * @returns Object with toast function and array of active toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastManager = ToastManager.getInstance();

  // Subscribe to toast changes on first render
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    setToasts(toastManager.getToasts());
    
    // Return cleanup function
    return unsubscribe;
  }, []);

  return {
    toast: (options: ToastOptions) => toastManager.addToast(options),
    toasts,
    dismissToast: (id: string) => toastManager.dismissToast(id),
  };
};

export default useToast;