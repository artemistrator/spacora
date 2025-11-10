// Request manager to limit concurrent requests and prevent browser overload
class RequestManager {
  private maxConcurrentRequests: number;
  private currentRequests: number;
  private requestQueue: Array<() => void> = [];
  
  constructor(maxConcurrentRequests: number = 3) {
    this.maxConcurrentRequests = maxConcurrentRequests;
    this.currentRequests = 0;
  }
  
  // Execute a request with concurrency limiting
  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    // Wait for available slot
    await this.waitForSlot();
    
    this.currentRequests++;
    console.log('RequestManager: Starting request, current requests:', this.currentRequests);
    
    try {
      const result = await requestFn();
      return result;
    } finally {
      this.currentRequests--;
      console.log('RequestManager: Finished request, current requests:', this.currentRequests);
      this.processQueue();
    }
  }
  
  // Wait for an available slot
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentRequests < this.maxConcurrentRequests) {
        // Slot available immediately
        resolve();
      } else {
        // Add to queue
        console.log('RequestManager: Request queued, current requests:', this.currentRequests);
        this.requestQueue.push(resolve);
      }
    });
  }
  
  // Process the next request in queue
  private processQueue() {
    if (this.requestQueue.length > 0 && this.currentRequests < this.maxConcurrentRequests) {
      const next = this.requestQueue.shift();
      if (next) {
        console.log('RequestManager: Processing queued request, queue length:', this.requestQueue.length);
        next();
      }
    }
  }
  
  // Get current status
  getStatus() {
    return {
      currentRequests: this.currentRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.maxConcurrentRequests
    };
  }
}

// Create a singleton instance
export const requestManager = new RequestManager(3);

// Helper function to wrap Supabase queries with timeout and concurrency control
export async function executeSupabaseQuery<T>(queryFn: () => Promise<T>, timeoutMs: number = 3000): Promise<T> {
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.log('Supabase query timeout after', timeoutMs, 'ms');
      reject(new Error('Request timeout'));
    }, timeoutMs);
  });
  
  // Execute with concurrency limiting
  return await Promise.race([
    requestManager.execute(queryFn),
    timeoutPromise
  ]);
}