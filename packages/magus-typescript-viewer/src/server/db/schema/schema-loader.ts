// Bundle the schema at build-time via esbuild text loader
// esbuild config must set loader for '.sql' to 'text'
import schemaSql from './schema.sql';

export function loadSchema(): string {
  return schemaSql as string;
}
