import * as React from "react";
import { cn } from "@/lib/utils";
import { useLazyLoadImage } from "@/hooks/use-image-lazy-load";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { motion } from "framer-motion";

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '21:9';
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  rounded?: boolean;
  shimmer?: boolean;
  fadeIn?: boolean;
  placeholder?: string;
  animateHover?: boolean;
  priority?: boolean;
}

// Function to get aspect ratio value
const getAspectRatioValue = (ratio: string): number => {
  switch (ratio) {
    case '1:1': return 1 / 1;
    case '4:3': return 4 / 3;
    case '16:9': return 16 / 9;
    case '21:9': return 21 / 9;
    default: return 16 / 9;
  }
};

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16:9',
  className,
  objectFit = 'cover',
  rounded = true,
  shimmer = true,
  fadeIn = true,
  placeholder,
  animateHover = false,
  priority = false,
}: ResponsiveImageProps) {
  // Use lazy loading hook (with or without priority)
  const { isLoaded, currentSrc, imageRef } = useLazyLoadImage({
    src,
    placeholder,
    threshold: priority ? 0 : 0.1,
    delay: priority ? 0 : 300
  });
  
  // Prepare class for the image container
  const containerClass = cn(
    "overflow-hidden",
    rounded && "rounded-lg",
    shimmer && !isLoaded && "shimmer animate-shimmer",
    className
  );
  
  // Prepare class for the image itself
  const imageClass = cn(
    "w-full h-full transition-all duration-700",
    objectFit === 'contain' && "object-contain",
    objectFit === 'cover' && "object-cover",
    objectFit === 'fill' && "object-fill",
    objectFit === 'none' && "object-none",
    objectFit === 'scale-down' && "object-scale-down",
    fadeIn && !isLoaded && "opacity-0 blur-md",
    fadeIn && isLoaded && "opacity-100 blur-0"
  );
  
  // Get the correct aspect ratio value
  const ratio = getAspectRatioValue(aspectRatio);

  // Determine if we need to animate with framer-motion
  const ImageComponent = animateHover ? motion.img : 'img';
  
  return (
    <AspectRatio ratio={ratio} className={containerClass}>
      <ImageComponent
        ref={imageRef}
        src={currentSrc || placeholder || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"}
        alt={alt}
        className={imageClass}
        loading={priority ? "eager" : "lazy"}
        {...(animateHover ? {
          whileHover: { scale: 1.05 },
          transition: { duration: 0.3 }
        } : {})}
      />
    </AspectRatio>
  );
}