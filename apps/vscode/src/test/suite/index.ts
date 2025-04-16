import * as path from 'path';

import { glob } from 'glob';
import Mocha from 'mocha';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise<void>((resolve, reject) => {
    glob('**/**.test.js', { cwd: testsRoot })
      .then((files: string[]) => {
        // Add files to the test suite
        files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

        try {
          // Run the mocha test
          mocha.run((failures: number) => {
            if (failures > 0) {
              reject(new Error(`${failures.toString()} tests failed.`));
            } else {
              resolve();
            }
          });
        } catch (err: unknown) {
          console.error(err);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .catch((err: unknown) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}
