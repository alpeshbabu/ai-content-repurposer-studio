import * as React from "react"
import { AlertTriangle, RefreshCw, XCircle, Info } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

const errorVariants = cva(
  "border border-destructive/50 text-destructive",
  {
    variants: {
      variant: {
        default: "bg-background",
        destructive: "bg-destructive/10",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ErrorDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorVariants> {
  title?: string
  description?: string
  onRetry?: () => void
  retryText?: string
  showIcon?: boolean
}

const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(
  ({ 
    className, 
    variant, 
    title = "Something went wrong", 
    description,
    onRetry,
    retryText = "Try Again",
    showIcon = true,
    ...props 
  }, ref) => {
    const getIcon = () => {
      switch (variant) {
        case "warning":
          return <AlertTriangle className="h-5 w-5" />
        case "info":
          return <Info className="h-5 w-5" />
        default:
          return <XCircle className="h-5 w-5" />
      }
    }

    return (
      <Alert
        ref={ref}
        className={cn(errorVariants({ variant }), className)}
        {...props}
      >
        {showIcon && getIcon()}
        <div className="ml-2">
          <h4 className="font-medium">{title}</h4>
          {description && (
            <AlertDescription className="mt-1">
              {description}
            </AlertDescription>
          )}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryText}
            </Button>
          )}
        </div>
      </Alert>
    )
  }
)
ErrorDisplay.displayName = "ErrorDisplay"

const ErrorCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string
    description?: string
    onRetry?: () => void
    retryText?: string
  }
>(({ 
  className, 
  title = "Error", 
  description = "Something went wrong. Please try again.",
  onRetry,
  retryText = "Retry",
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center p-8 space-y-4 bg-card rounded-lg border border-destructive/20",
      className
    )}
    {...props}
  >
    <div className="p-3 bg-destructive/10 rounded-full">
      <XCircle className="h-8 w-8 text-destructive" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="font-semibold text-destructive">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
    {onRetry && (
      <Button
        variant="outline"
        onClick={onRetry}
        className="mt-4"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        {retryText}
      </Button>
    )}
  </div>
))
ErrorCard.displayName = "ErrorCard"

const ErrorBoundary = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    error?: Error | null
    onReset?: () => void
    fallback?: React.ReactNode
  }
>(({ className, error, onReset, fallback, children, ...props }, ref) => {
  if (error) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <ErrorCard
        ref={ref}
        className={className}
        title="Application Error"
        description={error.message || "An unexpected error occurred."}
        onRetry={onReset}
        retryText="Reload"
        {...props}
      />
    )
  }

  return <>{children}</>
})
ErrorBoundary.displayName = "ErrorBoundary"

export { ErrorDisplay, ErrorCard, ErrorBoundary, errorVariants }