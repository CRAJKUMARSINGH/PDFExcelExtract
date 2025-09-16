import { Suspense, lazy, ComponentType, ReactNode, SuspenseProps } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Loader2 } from 'lucide-react';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-4 bg-red-50 rounded-md">
      <p className="text-red-700 font-medium">Something went wrong:</p>
      <pre className="text-red-600 mt-2 text-sm">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
      >
        Try again
      </button>
    </div>
  );
}

// Loading component with animation
function LoadingFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Type for lazy loading options
type LazyOptions = {
  loadingFallback?: ReactNode;
  errorFallback?: ComponentType<FallbackProps>;
  suspenseFallback?: ReactNode;
};

/**
 * Higher-order component for lazy loading with Suspense and ErrorBoundary
 */
function withLazyLoad<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyOptions = {}
) {
  const {
    loadingFallback = <LoadingFallback />,
    errorFallback = ErrorFallback,
    suspenseFallback = loadingFallback,
  } = options;

  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: T) => (
    <ErrorBoundary FallbackComponent={errorFallback}>
      <Suspense fallback={suspenseFallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  // Add a display name for better debugging
  const name = importFn.name || 'Component';
  WrappedComponent.displayName = `withLazyLoad(${name})`;

  return WrappedComponent;
}

/**
 * Lazy load a component with prefetching support
 */
function lazyWithPrefetch<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyOptions & { prefetch?: 'hover' | 'mount' | 'visible' } = {}
) {
  const { prefetch = 'hover', ...lazyOptions } = options;
  
  // Start prefetching immediately if set to 'mount'
  if (prefetch === 'mount') {
    importFn().catch(() => {
      // We'll handle the error when the component is actually loaded
    });
  }

  const LazyComponent = withLazyLoad(importFn, lazyOptions);

  // Add prefetching on hover if enabled
  if (prefetch === 'hover') {
    const prefetchComponent = () => {
      importFn().catch(() => {
        // Error will be handled by the ErrorBoundary
      });
    };

    const WrappedWithPrefetch = (props: T) => {
      return (
        <div onMouseEnter={prefetchComponent} onFocus={prefetchComponent}>
          <LazyComponent {...props} />
        </div>
      );
    };

    // Copy display name
    WrappedWithPrefetch.displayName = `lazyWithPrefetch(${LazyComponent.displayName || 'Component'})`;
    return WrappedWithPrefetch;
  }

  return LazyComponent;
}

export { withLazyLoad, lazyWithPrefetch, ErrorFallback, LoadingFallback };

export default lazyWithPrefetch;
