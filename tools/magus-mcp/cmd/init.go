package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/khallmark/obsidian-magic/tools/magus-mcp/internal"
)

const defaultEnvContent = `# MCP Server Environment Variables
# Add required tokens or keys here, for example:
GITHUB_TOKEN=your_github_token_here
`

// RunInit handles the init command
func RunInit(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("init command takes no arguments")
	}

	internal.Log("Initializing magus-mcp environment...")

	// Create directories
	if err := os.MkdirAll(internal.MagusDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", internal.MagusDir, err)
	}
	internal.Log(fmt.Sprintf("Created directory: %s", internal.MagusDir))

	if err := os.MkdirAll(internal.CursorDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", internal.CursorDir, err)
	}
	internal.Log(fmt.Sprintf("Created directory: %s", internal.CursorDir))

	// Write default magus config
	magusConfig := internal.GetDefaultMagusConfig()
	configPath := internal.DefaultMagusConfigFile
	if err := internal.SaveJsonFile(configPath, magusConfig); err != nil {
		return fmt.Errorf("failed to write magus config %s: %w", configPath, err)
	}
	internal.Log(fmt.Sprintf("Wrote default config: %s", configPath))

	// Write default cursor mcp config
	// Determine the path to the currently running executable
	executablePath, err := os.Executable()
	if err != nil {
		// Fallback if finding executable fails (less ideal)
		internal.Log("Warning: Could not determine executable path, using relative path './magus-mcp'")
		executablePath = "./magus-mcp" // Or perhaps os.Args[0]? Needs testing.
	}
	// Ensure the path is suitable for config (e.g., relative if running within project)
	// This might need refinement depending on deployment strategy.
	// For now, let's assume running from project root or PATH.
	cursorMcpConfig := internal.GetDefaultCursorMcpConfig(executablePath)
	if err := internal.SaveJsonFile(internal.McpConfigFile, cursorMcpConfig); err != nil {
		return fmt.Errorf("failed to write cursor mcp config %s: %w", internal.McpConfigFile, err)
	}
	internal.Log(fmt.Sprintf("Wrote default cursor config: %s", internal.McpConfigFile))

	// Create default .env file if it doesn't exist
	if _, err := os.Stat(internal.EnvFile); os.IsNotExist(err) {
		if err := os.WriteFile(internal.EnvFile, []byte(defaultEnvContent), 0644); err != nil {
			return fmt.Errorf("failed to create default %s file: %w", internal.EnvFile, err)
		}
		internal.Log(fmt.Sprintf("Created default environment file: %s (Please edit with your credentials)", internal.EnvFile))
	} else if err == nil {
		internal.Log(fmt.Sprintf("Environment file %s already exists, skipping creation.", internal.EnvFile))
	} else {
		// Other error checking stat
		return fmt.Errorf("failed to check for %s file: %w", internal.EnvFile, err)
	}

	// Make the executable itself executable (relevant if installed manually)
	if executablePath != "./magus-mcp" { // Avoid chmodding the fallback path
		if err := os.Chmod(executablePath, 0755); err != nil {
			// This might fail if the executable isn't owned by the user, etc.
			internal.Log(fmt.Sprintf("Warning: Failed to make %s executable: %v", executablePath, err))
		} else {
			internal.Verbose(fmt.Sprintf("Ensured %s is executable", executablePath))
		}
	} else {
		// If we are using the fallback, try to chmod os.Args[0] if it exists
		if mainExecutable, err := filepath.Abs(os.Args[0]); err == nil {
			if _, statErr := os.Stat(mainExecutable); statErr == nil {
				if err := os.Chmod(mainExecutable, 0755); err != nil {
					internal.Log(fmt.Sprintf("Warning: Failed to make %s executable: %v", mainExecutable, err))
				} else {
					internal.Verbose(fmt.Sprintf("Ensured %s is executable", mainExecutable))
				}
			}
		}
	}

	// Also initialize a root config file if requested
	rootConfigPath := internal.DefaultRootConfigFile
	if _, err := os.Stat(rootConfigPath); os.IsNotExist(err) {
		// Root config doesn't exist, create it
		if err := internal.SaveJsonFile(rootConfigPath, magusConfig); err != nil {
			internal.Log(fmt.Sprintf("Note: Could not create root config file %s: %v", rootConfigPath, err))
		} else {
			internal.Log(fmt.Sprintf("Created root config file: %s", rootConfigPath))
		}
	}

	internal.Log("Initialization complete.")
	return nil
}
