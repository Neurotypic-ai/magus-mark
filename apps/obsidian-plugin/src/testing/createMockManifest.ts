import type { PluginManifest as PluginManifestType } from 'obsidian';

export function createMockManifest(): PluginManifestType {
  return {
    id: 'magus-mark',
    name: 'Magus Mark',
    version: '0.1.0',
    author: 'Test Author',
    minAppVersion: '0.15.0',
    description: 'Mock manifest for testing',
  };
}
