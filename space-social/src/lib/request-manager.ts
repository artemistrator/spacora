class RequestManager {
  private maxConcurrentRequests: number;
  private currentRequests: number;
  private requestQueue: Array<() => void> = [];
  
  constructor(maxConcurrentRequests: number = 3) {
    this.maxConcurrentRequests = maxConcurrentRequests;
    this.currentRequests = 0;
  }
  
  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    
    this.currentRequests++;
    
    try {
      const result = await requestFn();
      return result;
    } finally {
      this.currentRequests--;
      this.processQueue();
    }
  }
  
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentRequests < this.maxConcurrentRequests) {
        resolve();
      } else {
        this.requestQueue.push(resolve);
      }
    });
  }
  
  private processQueue() {
    if (this.requestQueue.length > 0 && this.currentRequests < this.maxConcurrentRequests) {
      const next = this.requestQueue.shift();
      if (next) {
        next();
      }
    }
  }
  
  getStatus() {
    return {
      currentRequests: this.currentRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.maxConcurrentRequests
    };
  }
}

export const requestManager = new RequestManager(3);

export async function executeSupabaseQuery<T>(queryFn: () => Promise<T>, timeoutMs: number = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([
      requestManager.execute(queryFn),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    throw error;
  }
}