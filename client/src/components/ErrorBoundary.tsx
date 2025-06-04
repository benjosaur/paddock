import {
  FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from "react-error-boundary";

const ErrorBoundary = ({
  fallbackRender,
  children,
}: {
  fallbackRender: (error: FallbackProps) => React.ReactNode;
  children: React.ReactNode;
}) => {
  const logError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("ErrorBoundary caught an error:", error);
    console.error("Error info:", errorInfo);
    // Send to reporting service
  };
  return (
    <ReactErrorBoundary onError={logError} fallbackRender={fallbackRender}>
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
