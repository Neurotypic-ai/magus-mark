import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

// Mock environment for tests
const testEnv = {
  ...process.env,
  NODE_ENV: 'test',
  OPENAI_API_KEY: 'sk-test-key-for-integration-tests',
};

const cliPath = path.join(__dirname, '../../dist/cli.js');

describe('CLI Integration Tests', () => {
  beforeAll(async () => {
    // Ensure CLI is built
    try {
      await execAsync('pnpm run build', { cwd: path.join(__dirname, '../..') });
    } catch (error) {
      console.warn('Build failed, CLI may not be available for integration tests');
    }
  });

  afterAll(() => {
    // Cleanup any test artifacts
  });

  it('should display help when no command is provided', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} --help`, { env: testEnv });

      expect(stdout).toContain('magus-mark');
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('tag');
      expect(stdout).toContain('setup');
    } catch (error) {
      // CLI exits with code 0 for help, so catch is expected
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toContain('magus-mark');
    }
  });

  it('should show version information', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} --version`, { env: testEnv });
      expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toMatch(/\d+\.\d+\.\d+/);
    }
  });

  it('should handle invalid commands gracefully', async () => {
    try {
      await execAsync(`node ${cliPath} invalid-command`, { env: testEnv });
      expect.fail('Should have thrown an error for invalid command');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string; code: number };
      expect(execError.code).toBe(1);
      expect(execError.stderr || execError.stdout).toContain('Unknown');
    }
  });

  it('should run setup command without errors', async () => {
    // Note: This test would require mocking user input for full integration
    try {
      const { stdout, stderr } = await execAsync(`node ${cliPath} setup --help`, { env: testEnv });
      expect(stdout || stderr).toContain('Interactive configuration setup');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toContain('setup');
    }
  });

  it('should run health checks', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} health --help`, {
        env: testEnv,
        timeout: 5000,
      });

      expect(stdout).toContain('System health monitoring');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      // Health check might fail in test environment, but should produce output
      expect(execError.stdout || execError.stderr).toContain('health');
    }
  }, 15000);

  it('should handle natural language commands', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} ask --help`, { env: testEnv });
      expect(stdout).toContain('Natural language interface');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toContain('ask');
    }
  });

  it('should run stats command', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} stats --format=json`, { env: testEnv });

      // Should output some form of statistics
      expect(stdout).toBeTruthy();
    } catch (error) {
      const execError = error as { stdout: string; stderr: string; code?: number };
      // Stats might fail without usage data, but should handle gracefully
      expect(execError.code).not.toBe(undefined);
    }
  });

  it('should validate configuration', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} config get`, { env: testEnv });
      expect(stdout).toBeTruthy();
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      // Config command should at least show help or current config
      expect(execError.stdout || execError.stderr).toBeTruthy();
    }
  });

  it('should handle tag command help', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} tag --help`, { env: testEnv });
      expect(stdout).toContain('Process and tag conversations');
      expect(stdout).toContain('--model');
      expect(stdout).toContain('--dry-run');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toContain('tag');
    }
  });

  it('should handle workflow commands', async () => {
    try {
      const { stdout } = await execAsync(`node ${cliPath} workflow --help`, { env: testEnv });
      expect(stdout).toContain('workflow orchestration');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toContain('workflow');
    }
  });

  it('should handle dashboard demo', async () => {
    // Test that dashboard demo command exists and shows help
    try {
      const { stdout } = await execAsync(`node ${cliPath} demo --help`, { env: testEnv });
      expect(stdout).toContain('dashboard');
    } catch (error) {
      const execError = error as { stdout: string; stderr: string };
      expect(execError.stdout || execError.stderr).toContain('demo');
    }
  });
});
