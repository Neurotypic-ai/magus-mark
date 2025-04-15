package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/khallmark/obsidian-magic/tools/magus-mcp/internal"
)

// RunStart handles the start command
func RunStart(args []string) error {
	if len(args) != 1 {
		return fmt.Errorf("start command requires exactly one argument: <server-name>")
	}
	serverName := args[0]

	// Load environment variables from .env file
	loadEnvFile()

	// Load configuration
	config, err := internal.LoadMagusConfig("")
	if err != nil {
		return fmt.Errorf("could not load configuration to start server: %w", err)
	}

	// Find the server config
	serverConfig, found := config.Servers[serverName]
	if !found {
		return fmt.Errorf("server configuration not found for: %s", serverName)
	}

	internal.Log(fmt.Sprintf("Starting server '%s' with runner: %s", serverName, serverConfig.Runner))

	// Apply timeout if specified
	timeout := 0
	if serverConfig.Timeout > 0 {
		timeout = serverConfig.Timeout
	} else if config.Global != nil && config.Global.Timeout > 0 {
		timeout = config.Global.Timeout
	}

	if timeout > 0 {
		internal.Verbose(fmt.Sprintf("Server will time out after %d seconds if not responding", timeout))
	}

	// Prepare and execute the command based on the runner
	switch serverConfig.Runner {
	case "npx":
		return startNpxServer(serverConfig, timeout)
	case "docker":
		return startDockerServer(serverConfig, timeout)
	// Add case for Python-based servers (uvx)
	case "uvx":
		return startUvxServer(serverConfig, timeout)
	// Add case for pip-based servers
	case "pip":
		return startPipServer(serverConfig, timeout)
	// Add case for direct binary execution
	case "bin":
		return startBinaryServer(serverConfig, timeout)
	default:
		return fmt.Errorf("unknown runner type specified for server %s: %s", serverName, serverConfig.Runner)
	}
}

// loadEnvFile loads variables from the .env file if it exists.
func loadEnvFile() {
	if _, err := os.Stat(internal.EnvFile); os.IsNotExist(err) {
		internal.Verbose(".env file not found, skipping environment loading.")
		return
	}

	internal.Verbose(fmt.Sprintf("Loading environment variables from %s", internal.EnvFile))
	err := godotenv.Load(internal.EnvFile) // Loads into os.Getenv environment
	if err != nil {
		// Log as warning, maybe the file is malformed but some vars might be set externally
		internal.Log(fmt.Sprintf("Warning: Error loading %s file: %v", internal.EnvFile, err))
	}
}

// prepareCommand sets up common command properties like working directory and timeout
func prepareCommand(cmd *exec.Cmd, cfg internal.ServerConfig, timeoutSecs int) {
	// Set working directory if specified
	if cfg.WorkingDir != "" {
		cmd.Dir = cfg.WorkingDir
		internal.Verbose(fmt.Sprintf("Using working directory: %s", cfg.WorkingDir))
	}

	// Apply environment mappings if any
	if len(cfg.EnvMapping) > 0 {
		modifiedEnv := os.Environ()
		for srcKey, destKey := range cfg.EnvMapping {
			if val := os.Getenv(srcKey); val != "" {
				modifiedEnv = append(modifiedEnv, fmt.Sprintf("%s=%s", destKey, val))
				internal.Verbose(fmt.Sprintf("Mapping environment variable %s to %s", srcKey, destKey))
			}
		}
		cmd.Env = modifiedEnv
	} else {
		cmd.Env = os.Environ()
	}

	// Handle timeout if specified
	if timeoutSecs > 0 {
		go func() {
			time.Sleep(time.Duration(timeoutSecs) * time.Second)
			if cmd.Process != nil {
				internal.Log(fmt.Sprintf("Server timed out after %d seconds, terminating", timeoutSecs))
				cmd.Process.Signal(syscall.SIGTERM)
				// Give it a second to gracefully shut down
				time.Sleep(time.Second)
				cmd.Process.Kill()
			}
		}()
	}
}

// resolveEnvironmentVariables processes all args and expands any environment variables
func resolveEnvironmentVariables(args []string) []string {
	result := make([]string, len(args))
	for i, arg := range args {
		// Only process if it looks like it contains an environment variable
		if strings.Contains(arg, "${") && strings.Contains(arg, "}") {
			// Simple environment variable expansion
			expandedArg := arg
			for {
				start := strings.Index(expandedArg, "${")
				if start == -1 {
					break
				}
				end := strings.Index(expandedArg[start:], "}") + start
				if end == -1 {
					break
				}
				
				varName := expandedArg[start+2:end]
				varValue := os.Getenv(varName)
				
				expandedArg = expandedArg[:start] + varValue + expandedArg[end+1:]
			}
			result[i] = expandedArg
			internal.Verbose(fmt.Sprintf("Expanded environment variable in argument: %s -> %s", arg, expandedArg))
		} else {
			result[i] = arg
		}
	}
	return result
}

// startNpxServer executes the command for an NPX-based server.
func startNpxServer(cfg internal.ServerConfig, timeoutSecs int) error {
	if cfg.Package == "" {
		return fmt.Errorf("npx runner requires a 'package' field in config")
	}
	
	// Process args for environment variables
	resolvedArgs := resolveEnvironmentVariables(cfg.Args)
	
	// Construct args: npx [-y] <package> [config args...]
	// Always use -y to ensure the package is run even if not globally installed
	npxArgs := []string{"-y", cfg.Package}
	npxArgs = append(npxArgs, resolvedArgs...)

	internal.Verbose(fmt.Sprintf("Preparing NPX command: npx %s", strings.Join(npxArgs, " ")))

	// Find npx executable
	cmdPath, err := exec.LookPath("npx")
	if err != nil {
		return fmt.Errorf("could not find 'npx' executable in PATH: %w", err)
	}

	// Create command with prepared args
	cmd := exec.Command(cmdPath, npxArgs...)
	
	// Setup working directory, timeout, etc.
	prepareCommand(cmd, cfg, timeoutSecs)

	// Handle port if specified
	if cfg.Port > 0 {
		// For NPX servers, we assume they handle their own port binding
		// Just pass the PORT environment variable
		cmd.Env = append(cmd.Env, fmt.Sprintf("PORT=%d", cfg.Port))
		internal.Verbose(fmt.Sprintf("Setting PORT environment variable to %d", cfg.Port))
	}

	// Replace current process using syscall.Exec
	internal.Verbose(fmt.Sprintf("Executing via syscall.Exec: %s %v", cmdPath, npxArgs))
	err = syscall.Exec(cmdPath, append([]string{cmdPath}, npxArgs...), cmd.Env)
	if err != nil {
		// This error only happens if Exec itself fails (e.g., permission denied), not if the command fails
		return fmt.Errorf("failed to execute npx command via syscall.Exec: %w", err)
	}
	// syscall.Exec does not return on success
	return nil // Should not be reached
}

// startDockerServer executes the command for a Docker-based server.
func startDockerServer(cfg internal.ServerConfig, timeoutSecs int) error {
	if cfg.Image == "" {
		return fmt.Errorf("docker runner requires an 'image' field in config")
	}

	// Process args for environment variables
	resolvedArgs := resolveEnvironmentVariables(cfg.Args)

	// Construct args: docker run --rm -i [network] [env vars] [mounts] <image> [config args...]
	dockerArgs := []string{"run", "--rm", "-i"} // Always interactive and remove container on exit

	if cfg.Network != "" {
		dockerArgs = append(dockerArgs, "--network", cfg.Network)
	}

	// Add environment variables specified in config
	envVarsToPass := []string{} // For syscall.Exec
	for _, envKey := range cfg.Env {
		envValue := os.Getenv(envKey)
		if envValue == "" {
			internal.Log(fmt.Sprintf("Warning: Environment variable '%s' requested by config but not found in environment.", envKey))
			continue
		}
		dockerArgs = append(dockerArgs, "-e", envKey) // Docker CLI needs only the key if passing from host
		envVarsToPass = append(envVarsToPass, fmt.Sprintf("%s=%s", envKey, envValue)) // syscall.Exec needs full KEY=value
	}

	// Add mounts if specified
	if cfg.Mount != nil {
		if cfg.Mount.Source == "" || cfg.Mount.Destination == "" {
			return fmt.Errorf("docker mount config requires both 'source' and 'destination' fields")
		}
		// Resolve source path to absolute path relative to CWD
		sourcePath, err := filepath.Abs(cfg.Mount.Source)
		if err != nil {
			return fmt.Errorf("failed to resolve absolute path for mount source '%s': %w", cfg.Mount.Source, err)
		}
		mountArg := fmt.Sprintf("%s:%s", sourcePath, cfg.Mount.Destination)
		
		// Add read-only flag if specified
		if cfg.Mount.ReadOnly {
			mountArg += ":ro"
		}
		
		dockerArgs = append(dockerArgs, "-v", mountArg)
		internal.Verbose(fmt.Sprintf("Adding mount: %s", mountArg))
	}

	// Handle port if specified
	if cfg.Port > 0 {
		dockerArgs = append(dockerArgs, "-p", fmt.Sprintf("%d:%d", cfg.Port, cfg.Port))
		internal.Verbose(fmt.Sprintf("Adding port mapping: %d:%d", cfg.Port, cfg.Port))
	}

	// Add entrypoint override if specified
	if cfg.EntryPoint != "" {
		dockerArgs = append(dockerArgs, "--entrypoint", cfg.EntryPoint)
		internal.Verbose(fmt.Sprintf("Using custom entrypoint: %s", cfg.EntryPoint))
	}

	// Add working directory if specified
	if cfg.WorkingDir != "" {
		dockerArgs = append(dockerArgs, "-w", cfg.WorkingDir)
		internal.Verbose(fmt.Sprintf("Setting container working directory: %s", cfg.WorkingDir))
	}

	// Add custom Docker options if specified
	if cfg.CustomOpts != nil {
		for k, v := range cfg.CustomOpts {
			if strings.HasPrefix(k, "docker:") {
				opt := strings.TrimPrefix(k, "docker:")
				if v != "" {
					dockerArgs = append(dockerArgs, fmt.Sprintf("--%s=%s", opt, v))
				} else {
					dockerArgs = append(dockerArgs, fmt.Sprintf("--%s", opt))
				}
				internal.Verbose(fmt.Sprintf("Adding custom Docker option: %s", opt))
			}
		}
	}

	dockerArgs = append(dockerArgs, cfg.Image)    // Add the image name
	dockerArgs = append(dockerArgs, resolvedArgs...) // Add any command arguments for the container

	internal.Verbose(fmt.Sprintf("Preparing Docker command: docker %s", strings.Join(dockerArgs, " ")))

	// Find docker executable
	cmdPath, err := exec.LookPath("docker")
	if err != nil {
		return fmt.Errorf("could not find 'docker' executable in PATH: %w", err)
	}

	// We don't need to create a cmd here since we're using syscall.Exec directly
	// Skip cmd creation, but log warning about timeout limitations
	if timeoutSecs > 0 {
		internal.Verbose(fmt.Sprintf("Note: Timeout setting of %d seconds is not effective with syscall.Exec", timeoutSecs))
	}

	// Prepare environment for syscall.Exec
	// Combine system env + specific vars needed
	env := append(os.Environ(), envVarsToPass...)

	// Replace current process using syscall.Exec
	internal.Verbose(fmt.Sprintf("Executing via syscall.Exec: %s %v", cmdPath, dockerArgs))
	err = syscall.Exec(cmdPath, append([]string{cmdPath}, dockerArgs...), env)
	if err != nil {
		return fmt.Errorf("failed to execute docker command via syscall.Exec: %w", err)
	}
	return nil // Should not be reached
}

// startUvxServer executes the command for a uvx-based server (Python)
func startUvxServer(cfg internal.ServerConfig, timeoutSecs int) error {
	if cfg.Package == "" {
		return fmt.Errorf("uvx runner requires a 'package' field in config")
	}
	
	// Process args for environment variables
	resolvedArgs := resolveEnvironmentVariables(cfg.Args)
	
	// Construct args: uvx <package> [config args...]
	uvxArgs := []string{cfg.Package}
	uvxArgs = append(uvxArgs, resolvedArgs...)

	internal.Verbose(fmt.Sprintf("Preparing UVX command: uvx %s", strings.Join(uvxArgs, " ")))

	// Find uvx executable
	cmdPath, err := exec.LookPath("uvx")
	if err != nil {
		return fmt.Errorf("could not find 'uvx' executable in PATH: %w", err)
	}

	// Create command with prepared args
	cmd := exec.Command(cmdPath, uvxArgs...)
	
	// Setup working directory, timeout, etc.
	prepareCommand(cmd, cfg, timeoutSecs)

	// Handle port if specified
	if cfg.Port > 0 {
		// For uvx servers, we assume they handle their own port binding
		cmd.Env = append(cmd.Env, fmt.Sprintf("PORT=%d", cfg.Port))
		internal.Verbose(fmt.Sprintf("Setting PORT environment variable to %d", cfg.Port))
	}

	// Replace current process using syscall.Exec
	internal.Verbose(fmt.Sprintf("Executing via syscall.Exec: %s %v", cmdPath, uvxArgs))
	err = syscall.Exec(cmdPath, append([]string{cmdPath}, uvxArgs...), cmd.Env)
	if err != nil {
		return fmt.Errorf("failed to execute uvx command via syscall.Exec: %w", err)
	}
	return nil // Should not be reached
}

// startPipServer executes the command for a pip-based server (Python)
func startPipServer(cfg internal.ServerConfig, timeoutSecs int) error {
	if cfg.Package == "" {
		return fmt.Errorf("pip runner requires a 'package' field in config")
	}
	
	// Process args for environment variables
	resolvedArgs := resolveEnvironmentVariables(cfg.Args)
	
	// Construct args: python -m <package> [config args...]
	pythonArgs := []string{"-m", cfg.Package}
	pythonArgs = append(pythonArgs, resolvedArgs...)

	internal.Verbose(fmt.Sprintf("Preparing Python command: python %s", strings.Join(pythonArgs, " ")))

	// Find python executable
	cmdPath, err := exec.LookPath("python")
	if err != nil {
		// Try python3 if python is not available
		cmdPath, err = exec.LookPath("python3")
		if err != nil {
			return fmt.Errorf("could not find 'python' or 'python3' executable in PATH: %w", err)
		}
	}

	// Create command with prepared args
	cmd := exec.Command(cmdPath, pythonArgs...)
	
	// Setup working directory, timeout, etc.
	prepareCommand(cmd, cfg, timeoutSecs)

	// Handle port if specified
	if cfg.Port > 0 {
		cmd.Env = append(cmd.Env, fmt.Sprintf("PORT=%d", cfg.Port))
		internal.Verbose(fmt.Sprintf("Setting PORT environment variable to %d", cfg.Port))
	}

	// Replace current process using syscall.Exec
	internal.Verbose(fmt.Sprintf("Executing via syscall.Exec: %s %v", cmdPath, pythonArgs))
	err = syscall.Exec(cmdPath, append([]string{cmdPath}, pythonArgs...), cmd.Env)
	if err != nil {
		return fmt.Errorf("failed to execute python command via syscall.Exec: %w", err)
	}
	return nil // Should not be reached
}

// startBinaryServer executes a direct binary
func startBinaryServer(cfg internal.ServerConfig, timeoutSecs int) error {
	if cfg.Package == "" {
		return fmt.Errorf("bin runner requires a 'package' field with the binary path")
	}
	
	// Process args for environment variables
	resolvedArgs := resolveEnvironmentVariables(cfg.Args)
	
	internal.Verbose(fmt.Sprintf("Preparing binary execution: %s %s", cfg.Package, strings.Join(resolvedArgs, " ")))

	// Find executable (if it's a relative path, look in PATH)
	cmdPath := cfg.Package
	if !filepath.IsAbs(cmdPath) && !strings.Contains(cmdPath, "/") && !strings.Contains(cmdPath, "\\") {
		var err error
		cmdPath, err = exec.LookPath(cfg.Package)
		if err != nil {
			return fmt.Errorf("could not find '%s' executable in PATH: %w", cfg.Package, err)
		}
	} else {
		// Make sure the binary exists and is executable
		if _, err := os.Stat(cmdPath); err != nil {
			return fmt.Errorf("binary %s not found or not accessible: %w", cmdPath, err)
		}
	}

	// Create command with prepared args
	cmd := exec.Command(cmdPath, resolvedArgs...)
	
	// Setup working directory, timeout, etc.
	prepareCommand(cmd, cfg, timeoutSecs)

	// Handle port if specified
	if cfg.Port > 0 {
		cmd.Env = append(cmd.Env, fmt.Sprintf("PORT=%d", cfg.Port))
		internal.Verbose(fmt.Sprintf("Setting PORT environment variable to %d", cfg.Port))
	}

	// Replace current process using syscall.Exec
	internal.Verbose(fmt.Sprintf("Executing via syscall.Exec: %s %v", cmdPath, resolvedArgs))
	err := syscall.Exec(cmdPath, append([]string{cmdPath}, resolvedArgs...), cmd.Env)
	if err != nil {
		return fmt.Errorf("failed to execute binary via syscall.Exec: %w", err)
	}
	return nil // Should not be reached
}
