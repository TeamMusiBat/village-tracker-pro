
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "relative overflow-hidden bg-primary/10 text-primary-foreground shadow-[0_0_10px_var(--tw-shadow-color)] shadow-primary hover:shadow-[0_0_15px_var(--tw-shadow-color)]",
        "neon-outline": "relative overflow-hidden bg-transparent border border-primary/50 text-primary-foreground shadow-[0_0_10px_var(--tw-shadow-color)] shadow-primary hover:shadow-[0_0_15px_var(--tw-shadow-color)]",
        "neon-subtle": "relative overflow-hidden bg-primary/5 text-primary-foreground hover:bg-primary/10 hover:shadow-[0_0_8px_var(--tw-shadow-color)] shadow-primary transition-all duration-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const isNeonVariant = variant?.includes('neon');
    
    if (isNeonVariant) {
      // Extract only the motion-compatible props
      const {
        onClick,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        disabled,
        type,
        form,
        name,
        value,
        ...restProps
      } = props;
      
      const buttonProps = {
        onClick,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        disabled,
        type,
        form,
        name,
        value
      };
      
      return (
        <motion.button
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...buttonProps}
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.97 
          }}
        >
          {variant === 'neon' && (
            <span className="absolute inset-0 flex justify-center items-center opacity-0 hover:opacity-20 bg-primary rounded-md transition-opacity duration-300"></span>
          )}
          {children}
          {variant?.includes('neon') && !variant?.includes('subtle') && (
            <span className="absolute -inset-1 rounded-lg opacity-30 animate-neon-pulse"></span>
          )}
        </motion.button>
      );
    }
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton, buttonVariants };
