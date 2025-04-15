/**
 * API rate limiting information
 */

export interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date;
}
