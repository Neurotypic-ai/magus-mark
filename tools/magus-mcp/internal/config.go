package internal

import (
	"encoding/json"
	"fmt"
	"os"
)

// ServerConfig holds the configuration for a single MCP server.
// Use pointers for optional fields to distinguish between unset and zero values if needed,
// although omitempty often suffices.
type ServerConfig struct {
	Runner      string            `json:"runner"`            // e.g., "docker", "npx"
	Package     string            `json:"package,omitempty"` // For NPX runner
	Image       string            `json:"image,omitempty"`   // For Docker container
	Env         []string          `json:"env,omitempty"`     // List of ENV VAR *names* to pass through
	Args        []string          `json:"args,omitempty"`    // Arguments for the command
	Network     string            `json:"network,omitempty"` // e.g., "host" for Docker
	Mount       *MountConfig      `json:"mount,omitempty"`   // For filesystem mounts (e.g., Docker volume)
	WorkingDir  string            `json:"working_dir,omitempty"` // Working directory for the command
	Port        int               `json:"port,omitempty"`    // Port to use, if needed
	Timeout     int               `json:"timeout,omitempty"` // Timeout in seconds
	EnvMapping  map[string]string `json:"env_mapping,omitempty"` // Map environment variables to different names
	EntryPoint  string            `json:"entrypoint,omitempty"`  // Override entrypoint for Docker
	CustomOpts  map[string]string `json:"custom_opts,omitempty"` // Additional custom options for specific servers
}

// MountConfig defines source and destination for mounting.
type MountConfig struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
	ReadOnly    bool   `json:"read_only,omitempty"` // Whether the mount is read-only
}

// MagusConfig represents the main magus-mcp.json structure.
type MagusConfig struct {
	Version string                  `json:"version"`
	Servers map[string]ServerConfig `json:"servers"`
	Global  *GlobalConfig           `json:"global,omitempty"` // Global settings
}

// GlobalConfig represents global settings for all servers.
type GlobalConfig struct {
	EnvFile    string `json:"env_file,omitempty"`    // Path to env file
	DefaultEnv bool   `json:"default_env,omitempty"` // Whether to use default environment variables
	LogLevel   string `json:"log_level,omitempty"`   // Log level
	Timeout    int    `json:"timeout,omitempty"`     // Global timeout in seconds
}

// McpServerEntry represents a single server entry in .cursor/mcp.json.
type McpServerEntry struct {
	Command string   `json:"command"`
	Args    []string `json:"args"`
	Env     []string `json:"env,omitempty"`    // Environment variables for the command
	WorkDir string   `json:"workdir,omitempty"` // Working directory
}

// CursorMcpConfig represents the structure of .cursor/mcp.json.
type CursorMcpConfig struct {
	McpServers map[string]McpServerEntry `json:"mcpServers"`
}

// LoadMagusConfig reads and parses the magus-mcp.json file.
func LoadMagusConfig(path string) (*MagusConfig, error) {
	// If no specific path is provided, use the configured path
	if path == "" {
		path = GetConfigPath()
	}
	
	Verbose(fmt.Sprintf("Loading Magus config from: %s", path))
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read magus config file %s: %w", path, err)
	}
	var config MagusConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse magus config file %s: %w", path, err)
	}
	Verbose(fmt.Sprintf("Loaded %d server configurations", len(config.Servers)))
	return &config, nil
}

// SaveJsonFile saves the given data structure as JSON to the specified path.
func SaveJsonFile(path string, data interface{}) error {
	jsonData, err := json.MarshalIndent(data, "", "  ") // Use indentation for readability
	if err != nil {
		return fmt.Errorf("failed to marshal data to JSON for %s: %w", path, err)
	}
	err = os.WriteFile(path, jsonData, 0644) // Standard file permissions
	if err != nil {
		return fmt.Errorf("failed to write JSON file %s: %w", path, err)
	}
	Verbose(fmt.Sprintf("Successfully saved JSON file: %s", path))
	return nil
}

// --- Default Configuration Data ---

// GetDefaultMagusConfig returns the default structure for magus-mcp.json.
func GetDefaultMagusConfig() *MagusConfig {
	return &MagusConfig{
		Version: "1.0.0",
		Servers: map[string]ServerConfig{
			"git": {
				Runner:  "npx",
				Package: "mcp-server-git",
				Network: "host",
			},
			"github": {
				Runner:  "docker",
				Image:   "ghcr.io/github/github-mcp-server:latest",
				Env:     []string{"GITHUB_TOKEN"},
				Network: "host",
			},
			"filesystem": {
				Runner:  "npx",
				Package: "@modelcontextprotocol/server-filesystem",
				Mount: &MountConfig{
					Source:      ".", // Relative to workspace root
					Destination: "/workspace",
				},
				Network: "host",
				Args:    []string{"/workspace"},
			},
			"memory": {
				Runner:  "npx",
				Package: "@modelcontextprotocol/server-memory",
				Network: "host",
			},
			"sequential-thinking": {
				Runner:  "npx",
				Package: "@modelcontextprotocol/server-sequential-thinking",
				Network: "host",
			},
		},
		Global: &GlobalConfig{
			EnvFile:    ".env",
			DefaultEnv: true,
			LogLevel:   "info",
		},
	}
}

// GetDefaultCursorMcpConfig returns the default structure for .cursor/mcp.json.
func GetDefaultCursorMcpConfig(executablePath string) *CursorMcpConfig {
	// Use the provided path to ensure the command points to the correct binary
	return &CursorMcpConfig{
		McpServers: map[string]McpServerEntry{
			"git":                 {Command: executablePath, Args: []string{"start", "git"}},
			"github":              {Command: executablePath, Args: []string{"start", "github"}},
			"filesystem":          {Command: executablePath, Args: []string{"start", "filesystem"}},
			"memory":              {Command: executablePath, Args: []string{"start", "memory"}},
			"sequential-thinking": {Command: executablePath, Args: []string{"start", "sequential-thinking"}},
		},
	}
}
