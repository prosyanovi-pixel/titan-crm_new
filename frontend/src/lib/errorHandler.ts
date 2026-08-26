// Global error handler for unhandled promise rejections and other errors

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function initErrorHandler() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Check for the specific payload error
    if (event.reason && 
        typeof event.reason.message === 'string' && 
        event.reason.message.includes('payload')) {
      console.error('Payload access error detected - this may be due to:');
      console.error('1. API returning undefined/null unexpectedly');
      console.error('2. Missing error handling in async operations');
      console.error('3. Third-party library issue');
      
      // Prevent the error from crashing the app
      event.preventDefault();
    }
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    // Only log if there's an actual error
    if (event.error) {
      console.error('Global error:', event.error);
      
      // Check for chunk loading errors
      if (event.message && event.message.includes('Loading chunk')) {
        console.error('Chunk loading error - attempting reload...');
        // Could trigger a reload here if needed
      }
    }
  });
}

// Safe property access helper
export function safeGet<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  try {
    const keys = path.split('.');
    let result: unknown = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      if (!isRecord(result)) {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? (result as T) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// Safe payload access
export function getPayload<T>(response: unknown): T | null {
  if (!response) return null;
  if (typeof response !== 'object') return null;
  if (isRecord(response) && 'payload' in response) {
    return (response.payload as T) ?? null;
  }
  return response as T;
}
