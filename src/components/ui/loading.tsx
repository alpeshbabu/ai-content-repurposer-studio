import * as React from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <Loader2 className={cn(loadingVariants({ size }))} />
        {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

const LoadingCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { text?: string }
>(({ className, text = "Loading...", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center p-8 space-y-4 bg-card rounded-lg border",
      className
    )}
    {...props}
  >
    <LoadingSpinner size="lg" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
))
LoadingCard.displayName = "LoadingCard"

const LoadingSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
))
LoadingSkeleton.displayName = "LoadingSkeleton"

const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean
    loadingText?: string
  }
>(({ className, children, isLoading, loadingText, disabled, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90",
      className
    )}
    disabled={isLoading || disabled}
    {...props}
  >
    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {isLoading ? loadingText || "Loading..." : children}
  </button>
))
LoadingButton.displayName = "LoadingButton"

export { LoadingSpinner, LoadingCard, LoadingSkeleton, LoadingButton, loadingVariants }