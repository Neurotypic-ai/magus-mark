/**
 * Extract the top-level package name from an import path.
 * Examples:
 *  - 'lodash/map' -> 'lodash'
 *  - '@scope/pkg/sub' -> '@scope/pkg'
 */
export function getExternalPackageName(path: string): string {
  if (path.startsWith('@')) {
    const [scope, pkg] = path.split('/');
    return [scope, pkg].filter(Boolean).join('/');
  }
  const [pkg] = path.split('/');
  return (pkg ?? path).trim();
}

