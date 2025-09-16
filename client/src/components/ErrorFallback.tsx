import React from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ErrorFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const navigate = useNavigate();
  
  const handleReset = () => {
    resetErrorBoundary();
  };
  
  const handleGoHome = () => {
    navigate('/');
    resetErrorBoundary();
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-xl shadow-lg overflow-hidden border border-border">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We're sorry, but an unexpected error occurred. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-md text-left overflow-auto max-h-60">
                  <pre className="text-sm text-destructive">
                    {error.message}\n\n{error.stack}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleGoHome}
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
              
              <Button
                variant="default"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleReset}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>If the problem persists, please contact support.</p>
              <p className="mt-1">Error ID: {Date.now().toString(36)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
