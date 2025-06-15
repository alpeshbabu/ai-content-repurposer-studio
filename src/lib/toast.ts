import toast from 'react-hot-toast'
import { toast as sonnerToast } from 'sonner'

// Export toast for backward compatibility
export { toast }

// Enhanced toast notification system using both react-hot-toast and Sonner
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface ToastOptions {
  duration?: number
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'
  icon?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  dismissible?: boolean
  unstyled?: boolean
}

// Default configurations for different toast types
const defaultConfigs = {
  success: {
    duration: 4000,
    icon: '✅',
  },
  error: {
    duration: 6000,
    icon: '❌',
  },
  warning: {
    duration: 5000,
    icon: '⚠️',
  },
  info: {
    duration: 4000,
    icon: 'ℹ️',
  },
  loading: {
    duration: Infinity,
    icon: '⏳',
  },
} as const

// Enhanced toast notification system
export const notifications = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: ToastOptions) => {
    const config = { ...defaultConfigs.success, ...options }
    
    if (options?.description || options?.action) {
      // Use Sonner for rich notifications
      return sonnerToast.success(message, {
        description: options.description,
        duration: config.duration,
        action: options.action,
        cancel: options.cancel,
        dismissible: options.dismissible,
        unstyled: options.unstyled,
      })
    } else {
      // Use react-hot-toast for simple notifications
      return toast.success(message, {
        duration: config.duration,
        icon: config.icon,
        position: options?.position || 'top-center',
      })
    }
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    const config = { ...defaultConfigs.error, ...options }
    
    if (options?.description || options?.action) {
      return sonnerToast.error(message, {
        description: options.description,
        duration: config.duration,
        action: options.action,
        cancel: options.cancel,
        dismissible: options.dismissible,
        unstyled: options.unstyled,
      })
    } else {
      return toast.error(message, {
        duration: config.duration,
        icon: config.icon,
        position: options?.position || 'top-center',
      })
    }
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    const config = { ...defaultConfigs.warning, ...options }
    
    if (options?.description || options?.action) {
      return sonnerToast.warning(message, {
        description: options.description,
        duration: config.duration,
        action: options.action,
        cancel: options.cancel,
        dismissible: options.dismissible,
        unstyled: options.unstyled,
      })
    } else {
      return toast(message, {
        duration: config.duration,
        icon: config.icon,
        position: options?.position || 'top-center',
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #F59E0B',
        },
      })
    }
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    const config = { ...defaultConfigs.info, ...options }
    
    if (options?.description || options?.action) {
      return sonnerToast.info(message, {
        description: options.description,
        duration: config.duration,
        action: options.action,
        cancel: options.cancel,
        dismissible: options.dismissible,
        unstyled: options.unstyled,
      })
    } else {
      return toast(message, {
        duration: config.duration,
        icon: config.icon,
        position: options?.position || 'top-center',
        style: {
          background: '#DBEAFE',
          color: '#1E40AF',
          border: '1px solid #3B82F6',
        },
      })
    }
  },

  /**
   * Show a loading toast notification
   */
  loading: (message: string, options?: ToastOptions) => {
    const config = { ...defaultConfigs.loading, ...options }
    
    if (options?.description || options?.action) {
      return sonnerToast.loading(message, {
        description: options.description,
        action: options.action,
        cancel: options.cancel,
        dismissible: options.dismissible,
        unstyled: options.unstyled,
      })
    } else {
      return toast.loading(message, {
        duration: config.duration,
        position: options?.position || 'top-center',
      })
    }
  },

  /**
   * Show a promise-based toast notification
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    if (options?.description || options?.action) {
      return sonnerToast.promise(promise, {
        loading: loadingMessage,
        success: successMessage,
        error: errorMessage,
        duration: options.duration,
        action: options.action,
        cancel: options.cancel,
        dismissible: options.dismissible,
        unstyled: options.unstyled,
      })
    } else {
      return toast.promise(promise, {
        loading: loadingMessage,
        success: successMessage,
        error: errorMessage,
      })
    }
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
      sonnerToast.dismiss(toastId)
    } else {
      toast.dismiss()
      sonnerToast.dismiss()
    }
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss()
    sonnerToast.dismiss()
  },

  /**
   * Custom toast with full control
   */
  custom: (message: string, options: ToastOptions & { type?: ToastType }) => {
    const type = options.type || 'info'
    
    if (options.description || options.action) {
      switch (type) {
        case 'success':
          return sonnerToast.success(message, options)
        case 'error':
          return sonnerToast.error(message, options)
        case 'warning':
          return sonnerToast.warning(message, options)
        case 'loading':
          return sonnerToast.loading(message, options)
        default:
          return sonnerToast.info(message, options)
      }
    } else {
      return toast(message, {
        duration: options.duration || 4000,
        icon: options.icon,
        position: options.position || 'top-center',
      })
    }
  },
}

// Predefined notification templates for common use cases
export const notificationTemplates = {
  // Authentication
  signInSuccess: () => notifications.success('Successfully signed in!'),
  signOutSuccess: () => notifications.success('Successfully signed out!'),
  signInError: (error?: string) => 
    notifications.error('Failed to sign in', { 
      description: error || 'Please check your credentials and try again.' 
    }),

  // Content Management
  contentSaved: () => notifications.success('Content saved successfully!'),
  contentDeleted: () => notifications.success('Content deleted successfully!'),
  contentError: (action: string) => 
    notifications.error(`Failed to ${action} content`, {
      description: 'Please try again or contact support if the problem persists.'
    }),

  // Settings
  settingsSaved: () => notifications.success('Settings saved successfully!'),
  settingsError: () => 
    notifications.error('Failed to save settings', {
      description: 'Please check your internet connection and try again.'
    }),

  // Subscription
  subscriptionUpdated: () => 
    notifications.success('Subscription updated!', {
      description: 'Your plan changes are now active.'
    }),
  subscriptionError: () => 
    notifications.error('Subscription update failed', {
      description: 'Please try again or contact support.'
    }),

  // Usage Limits
  usageLimitReached: () => 
    notifications.warning('Usage limit reached', {
      description: 'Upgrade your plan to continue creating content.',
      action: {
        label: 'Upgrade',
        onClick: () => window.location.href = '/dashboard/settings/subscription'
      }
    }),

  // Network/API Errors
  networkError: () => 
    notifications.error('Network error', {
      description: 'Please check your internet connection.',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    }),

  // File Operations
  fileUploaded: (filename: string) => 
    notifications.success(`${filename} uploaded successfully!`),
  fileUploadError: (filename: string) => 
    notifications.error(`Failed to upload ${filename}`, {
      description: 'Please check the file size and format.'
    }),

  // Team Management
  memberInvited: (email: string) => 
    notifications.success('Invitation sent!', {
      description: `Invitation sent to ${email}`
    }),
  memberRemoved: (name: string) => 
    notifications.success('Member removed', {
      description: `${name} has been removed from the team`
    }),

  // AI Generation
  contentGenerating: () => notifications.loading('Generating content...'),
  contentGenerated: () => notifications.success('Content generated successfully!'),
  contentGenerationError: () => 
    notifications.error('Failed to generate content', {
      description: 'Please try again with different parameters.'
    }),
}

// Export the main notifications object as default
export default notifications