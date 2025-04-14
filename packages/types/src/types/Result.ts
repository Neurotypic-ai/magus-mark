/**
 * Result type for operations that can fail
 */

export type Result<T, E = Error> = { success: true; value: T; } | { success: false; error: E; };
