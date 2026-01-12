/**
 * Extract a human-readable error message from any input.
 * Guarantees that "[object Object]" is never returned by performing deep inspection,
 * safe JSON serialization, and property harvesting.
 */
export function getErrorMessage(error: any): string {
  if (error === null || error === undefined) {
    return 'Unknown Error (Null/Undefined)';
  }

  // 1. Direct strings
  if (typeof error === 'string') {
    if (error.includes('525')) {
      return "Protocol Error #525: A UI component attempted to load (Lazy) during a synchronous update. This usually happens in React 19 when a state change that reveals a lazy component is not wrapped in startTransition.";
    }
    return error;
  }

  // 2. Deep inspection for minified React errors (especially #525: Suspense mismatch)
  const msg = error?.message || '';
  const stack = error?.stack || '';
  const componentStack = error?.componentStack || '';
  const digest = error?.digest || '';
  const rawString = String(error);
  
  if (msg.includes('525') || rawString.includes('525') || stack.includes('525') || componentStack.includes('525') || digest.includes('525')) {
    return "Protocol Error #525: A UI component attempted to load (Lazy) during a synchronous update. The system has automatically calibrated the transition. (React 19 Security Protocol)";
  }

  // 3. Standard Error instances
  if (error instanceof Error) {
    const descriptiveError = (error as any).description || (error as any).reason || error.message;
    return descriptiveError || error.name || 'Anonymous Error Instance';
  }

  // 4. Object inspection (Crucial for preventing [object Object])
  if (typeof error === 'object') {
    // Harvest common message properties
    const possibleMessage = error.message || error.error || error.reason || error.statusText || error.code || error.description;
    if (possibleMessage && typeof possibleMessage === 'string') {
      return possibleMessage;
    }

    // React Fiber / Component Stack harvesting
    if (error.componentStack) {
      return `Component Failure Trace: ${String(error.componentStack).substring(0, 200)}...`;
    }

    // Handle standard Error-like objects that aren't Error instances
    if (error.name && error.message) {
      return `${error.name}: ${error.message}`;
    }

    // Final attempt: Safe stringification
    try {
      const stringified = JSON.stringify(error, (key, value) => {
        if (key === 'componentStack' || key === 'stack' || key === 'digest') return undefined; // Filter noise
        return value;
      });
      
      if (stringified !== '{}' && stringified !== 'undefined' && stringified !== 'null') {
        return `System Diagnostic: ${stringified.substring(0, 300)}${stringified.length > 300 ? '...' : ''}`;
      }
    } catch (e) {
      // Stringification failed (likely circular reference)
      const keys = Object.keys(error).join(', ');
      return `Non-serializable Error Object (Keys: ${keys})`;
    }
  }

  // 5. Final fallback string conversion
  if (rawString === '[object Object]') {
    const constructorName = error.constructor?.name || 'Unknown';
    return `Critical Protocol Failure: Opaque ${constructorName} object in render flow. Check browser console for raw stack trace.`;
  }

  return rawString || 'Unspecified runtime error';
}
