/**
 * Formatters for CLI
 */
export default class Formatters {
  /**
   * Format a file path for display
   */
  formatPath(filePath: string): string {
    const homedir = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '~';
    return filePath.replace(homedir, '~');
  }

  /**
   * Calculate tokens in a string
   */
  calculateTokens(text: string): number {
    // Approximation: 1 token = 4 characters on average
    return Math.ceil(text.length / 4);
  }

  /**
   * Format a number as currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  }

  /**
   * Format a duration in milliseconds
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }

    if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }

    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${String(minutes)}m ${seconds}s`;
  }
}
