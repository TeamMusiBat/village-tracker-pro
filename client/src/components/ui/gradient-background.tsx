import React from "react";
import { motion } from "framer-motion";

export interface GradientBackgroundProps {
  variant?: "default" | "radial" | "mesh" | "waves" | "dots";
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  animate?: boolean;
  speed?: "slow" | "medium" | "fast";
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function GradientBackground({
  variant = "default",
  primaryColor = "rgba(0, 85, 255, 0.8)",
  secondaryColor = "rgba(0, 15, 55, 0.85)",
  tertiaryColor = "rgba(25, 0, 80, 0.9)",
  animate = true,
  speed = "medium",
  intensity = "medium",
  className = "",
}: GradientBackgroundProps) {
  // Calculate animation speed based on speed prop
  const animationDuration = React.useMemo(() => {
    switch (speed) {
      case "slow": return 30;
      case "medium": return 20;
      case "fast": return 10;
    }
  }, [speed]);
  
  // Calculate blur and opacity based on intensity
  const blurAmount = React.useMemo(() => {
    switch (intensity) {
      case "low": return "40px";
      case "medium": return "80px";
      case "high": return "120px";
    }
  }, [intensity]);
  
  const opacityAmount = React.useMemo(() => {
    switch (intensity) {
      case "low": return 0.4;
      case "medium": return 0.6;
      case "high": return 0.8;
    }
  }, [intensity]);
  
  // Determine background styles based on variant
  const getBackgroundStyles = () => {
    switch (variant) {
      case "radial":
        return {
          background: `radial-gradient(circle at 50% 50%, ${primaryColor}, ${secondaryColor}, ${tertiaryColor})`,
          filter: `blur(${blurAmount})`,
          opacity: opacityAmount
        };
        
      case "mesh":
        return {
          background: `
            linear-gradient(60deg, ${primaryColor} 0%, transparent 100%),
            linear-gradient(120deg, ${secondaryColor} 0%, transparent 100%),
            linear-gradient(240deg, ${tertiaryColor} 0%, transparent 100%)
          `,
          filter: `blur(${blurAmount})`,
          opacity: opacityAmount
        };
        
      case "waves":
        return {
          background: `
            linear-gradient(45deg, ${primaryColor} 0%, transparent 70%),
            linear-gradient(135deg, ${secondaryColor} 10%, transparent 80%),
            linear-gradient(225deg, ${tertiaryColor} 20%, transparent 90%)
          `,
          filter: `blur(${blurAmount})`,
          opacity: opacityAmount
        };
        
      case "dots":
        return {
          background: `
            radial-gradient(circle at 25% 25%, ${primaryColor} 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, ${secondaryColor} 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${tertiaryColor} 0%, transparent 50%)
          `,
          backgroundSize: '100px 100px',
          filter: `blur(${blurAmount})`,
          opacity: opacityAmount
        };
        
      default: // "default"
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${tertiaryColor})`,
          filter: `blur(${blurAmount})`,
          opacity: opacityAmount
        };
    }
  };
  
  // Animation variants
  const animationVariants = {
    wave: {
      x: [0, 20, -20, 20, 0],
      y: [0, -20, 0, 20, 0],
      scale: [1, 1.05, 0.95, 1.05, 1],
      rotate: [0, 2, -2, 2, 0],
      transition: {
        duration: animationDuration,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [opacityAmount, opacityAmount * 1.2, opacityAmount],
      transition: {
        duration: animationDuration / 2,
        ease: "easeInOut",
        repeat: Infinity
      }
    },
    static: {}
  };
  
  // Pick animation type based on variant
  const getAnimation = () => {
    if (!animate) return "static";
    
    switch (variant) {
      case "waves":
      case "mesh":
        return "wave";
      default:
        return "pulse";
    }
  };
  
  return (
    <div className={`fixed inset-0 overflow-hidden -z-10 ${className}`}>
      <motion.div
        className="absolute inset-[-100px] rounded-full"
        style={getBackgroundStyles()}
        initial="static"
        animate={getAnimation()}
        variants={animationVariants}
      />
    </div>
  );
}