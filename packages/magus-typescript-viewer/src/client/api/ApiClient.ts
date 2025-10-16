import type { Module } from '../../shared/types/Module';
import type { Package } from '../../shared/types/Package';

/**
 * HTTP client for the TypeScript Viewer API.
 * Provides type-safe methods for fetching packages and modules.
 */
export class ApiClient {
  /**
   * Creates a new ApiClient instance.
   * @param baseUrl Base URL for the API server
   */
  constructor(private baseUrl: string) {}

  /**
   * Fetches all packages from the API.
   * @returns Promise resolving to an array of packages
   * @throws Error if the HTTP request fails or response is invalid
   */
  async getPackages(): Promise<Package[]> {
    return this.get<Package>('/packages');
  }

  /**
   * Fetches all modules for a specific package.
   * @param packageId The UUID of the package
   * @returns Promise resolving to an array of modules
   * @throws Error if the HTTP request fails or response is invalid
   */
  async getModules(packageId: string): Promise<Module[]> {
    return this.get<Module>('/modules', { packageId });
  }

  private async get<T>(resource: string, queryParams?: Record<string, string>): Promise<T[]> {
    const queryString = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';
    const response = await fetch(`${this.baseUrl}${resource}${queryString}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }

    const data = (await response.json()) as T[];

    if (!Array.isArray(data)) {
      throw new Error('Invalid response: data is not an array');
    }

    if (!data.every((item) => typeof item === 'object')) {
      throw new Error('Invalid response: items are not objects');
    }

    return data;
  }
}
