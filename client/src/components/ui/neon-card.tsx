
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const cardVariants = cva(
  "rounded-xl shadow-md overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        outline: "bg-transparent border border-border",
        glass: "bg-background/80 backdrop-blur-sm border border-border/20",
        neon: "relative bg-black/50 border border-primary/30 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-primary",
        "neon-subtle": "relative bg-black/30 border border-primary/20 shadow-[0_0_5px_var(--tw-shadow-color)] shadow-primary",
        "neon-glass": "relative bg-black/10 backdrop-blur-md border border-primary/20 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-primary",
      },
      hover: {
        default: "",
        lift: "transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl",
        glow: "transition-all duration-300 hover:shadow-[0_0_25px_var(--tw-shadow-color)] hover:shadow-primary",
        grow: "transition-all duration-300 hover:scale-[1.02]",
        none: "",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "default",
      size: "default",
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  animate?: boolean;
}

const cardAnimationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const NeonCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, size, asChild = false, animate = false, children, ...props }, ref) => {
    const isNeonVariant = variant?.includes('neon');
    
    if (animate || isNeonVariant) {
      // Separate motion props from div props
      const { onDrag, onDragStart, onDragEnd, ...divProps } = props;
      
      return (
        <motion.div
          className={cn(cardVariants({ variant, hover, size, className }))}
          ref={ref}
          {...divProps}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
          variants={animate ? cardAnimationVariants : undefined}
          whileHover={isNeonVariant ? { scale: 1.01 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {children}
          {isNeonVariant && !variant?.includes('subtle') && (
            <div className="absolute -inset-px rounded-xl opacity-10 blur-sm animate-neon-pulse"></div>
          )}
        </motion.div>
      );
    }
    
    return (
      <div
        className={cn(cardVariants({ variant, hover, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeonCard.displayName = "NeonCard";

export { NeonCard, cardVariants };
