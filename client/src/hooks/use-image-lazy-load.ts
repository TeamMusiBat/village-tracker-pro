import { useState, useEffect, useRef } from 'react';

interface UseLazyLoadImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
  delay?: number;
}

export function useLazyLoadImage({
  src,
  placeholder,
  threshold = 0.1,
  delay = 300
}: UseLazyLoadImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset state if src changes
    if (src !== currentSrc) {
      setIsLoaded(false);
      setCurrentSrc(placeholder || '');
    }

    const img = imageRef.current;
    if (!img) return;

    // Create new intersection observer
    let observer: IntersectionObserver;

    const loadImage = () => {
      // Create a new image to preload the image
      const image = new Image();
      
      // Set up event handlers for loading
      image.onload = () => {
        // Apply a small delay for smoother transitions
        if (delay > 0) {
          // @ts-ignore - setTimeout returns number in browser, NodeJS.Timeout in Node
          timeoutRef.current = setTimeout(() => {
            setCurrentSrc(src);
            setIsLoaded(true);
          }, delay);
        } else {
          setCurrentSrc(src);
          setIsLoaded(true);
        }
      };
      
      image.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        // Keep the placeholder if loading fails
      };
      
      // Start loading the image
      image.src = src;
    };
    
    // Create an intersection observer to detect when the image enters the viewport
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadImage();
          // Disconnect observer after detection
          observer.disconnect();
          observerRef.current = null;
        }
      },
      { threshold }
    );
    
    observerRef.current = observer;
    observer.observe(img);
    
    return () => {
      // Clean up
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, placeholder, threshold, delay]);
  
  return { isLoaded, currentSrc, imageRef };
}