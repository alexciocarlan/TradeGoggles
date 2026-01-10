
// utils/workerFactory.ts

import { getErrorMessage } from './errorUtils'; // Import the new utility

// Use the browser's global WorkerOptions type
interface BlobWorkerOptions extends WorkerOptions {
  type?: 'classic' | 'module';
}

/**
 * Fetches a worker script by URL, creates a Blob from its content, and
 * returns a Worker instance with a Blob URL.
 * This is a robust way to ensure same-origin loading and avoid CORS issues.
 *
 * @param scriptPath The URL path to the worker script (e.g., '/workers/my.worker.ts').
 * @param options Worker options, including `type: 'module'` if it's an ES module.
 * @returns A Promise that resolves to a tuple [Worker, string] containing the Worker instance and its Blob URL.
 */
export async function createBlobWorker(scriptPath: string, options?: BlobWorkerOptions): Promise<[Worker, string]> {
  try {
    const response = await fetch(scriptPath);
    
    // Check for HTTP errors (404, 500, etc.)
    if (!response.ok) {
      throw new Error(`Failed to load worker script: ${response.status} ${response.statusText} (${scriptPath})`);
    }

    // Check if the server returned HTML (often happens with SPA routing for 404s)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Worker script not found (server returned HTML). Check if '${scriptPath}' exists in the public directory.`);
    }

    const scriptText = await response.text();

    const blobType = options?.type === 'module' ? 'application/javascript' : 'text/javascript';
    const blob = new Blob([scriptText], { type: blobType });
    const blobUrl = URL.createObjectURL(blob);

    const worker = new Worker(blobUrl, options);

    return [worker, blobUrl];
  } catch (error) {
    // Log the message of the error if it's an Error instance, otherwise log the error object itself
    console.error(`[WorkerFactory] Error creating Blob Worker for ${scriptPath}:`, getErrorMessage(error)); 
    throw error;
  }
}
