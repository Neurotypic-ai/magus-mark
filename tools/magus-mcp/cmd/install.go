package cmd

import (
	"fmt"
	"strings"

	"github.com/khallmark/obsidian-magic/tools/magus-mcp/internal"
)

// RunInstall handles the install command
func RunInstall(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("install command takes no arguments")
	}

	internal.Log("Checking and installing dependencies...")

	// Load configuration to know which servers exist
	config, err := internal.LoadMagusConfig("")
	if err != nil {
		return fmt.Errorf("could not load configuration for install: %w", err)
	}

	dockerAvailable := checkDocker()
	npxAvailable := checkNpx()
	// TODO: Check for uv when implemented

	// Iterate through configured servers and install prerequisites
	for name, server := range config.Servers {
		internal.Verbose(fmt.Sprintf("Checking prerequisites for server: %s (runner: %s)", name, server.Runner))

		switch server.Runner {
		case "docker":
			if !dockerAvailable {
				internal.Log(fmt.Sprintf("Warning: Docker not available, cannot prepare Docker-based server: %s", name))
				continue
			}
			if server.Image == "" {
				internal.Log(fmt.Sprintf("Warning: No image specified for Docker server: %s", name))
				continue
			}
			pullDockerImage(server.Image)
		case "npx":
			if !npxAvailable {
				internal.Log(fmt.Sprintf("Warning: npx not available, cannot prepare NPX-based server: %s", name))
				continue
			}
			if server.Package == "" {
				internal.Log(fmt.Sprintf("Warning: No package specified for NPX server: %s", name))
				continue
			}
			checkNpxPackage(server.Package)
		// Add cases for other runners like "uv" when needed
		default:
			internal.Log(fmt.Sprintf("Warning: Unknown runner type '%s' for server %s, skipping install check.", server.Runner, name))
		}
	}

	internal.Log("Installation checks complete.")
	return nil
}

// checkDocker checks if Docker is installed and the daemon is running.
func checkDocker() bool {
	internal.Verbose("Checking for Docker...")
	if !internal.CheckExecutable("docker") {
		internal.Log("Warning: 'docker' command not found in PATH.")
		return false
	}
	// Check if docker daemon is running
	err := internal.RunCmd("docker", "info")
	if err != nil {
		// Log the specific error only in verbose mode
		internal.Verbose(fmt.Sprintf("Docker daemon check failed: %v", err))
		internal.Log("Warning: Docker command found, but the Docker daemon appears to be unavailable.")
		return false
	}
	internal.Verbose("Docker is available and daemon is running.")
	return true
}

// pullDockerImage attempts to pull a Docker image if it doesn't exist locally.
func pullDockerImage(image string) {
	internal.Verbose(fmt.Sprintf("Checking Docker image: %s", image))
	// Use docker image inspect with a format for minimal output, check exit code
	err := internal.RunCmd("docker", "image", "inspect", "--format", "{{.ID}}", image)
	if err == nil {
		internal.Verbose(fmt.Sprintf("Docker image %s already exists locally.", image))
		return // Image already exists
	}

	internal.Log(fmt.Sprintf("Pulling Docker image: %s (this may take a while)...", image))
	err = internal.RunCmd("docker", "pull", image)
	if err != nil {
		// Only log failure as a warning, don't halt the entire process
		internal.Log(fmt.Sprintf("Warning: Failed to pull Docker image %s: %v", image, err))
	} else {
		internal.Log(fmt.Sprintf("Successfully pulled Docker image: %s", image))
	}
}

// checkNpx checks if npx is available.
func checkNpx() bool {
	internal.Verbose("Checking for npx...")
	if !internal.CheckExecutable("npx") {
		internal.Log("Warning: 'npx' command not found in PATH.")
		return false
	}
	// Optionally run `npx --version` to be more certain
	err := internal.RunCmd("npx", "--version")
	if err != nil {
		internal.Verbose(fmt.Sprintf("npx version check failed: %v", err))
		internal.Log("Warning: npx command found, but 'npx --version' failed.")
		return false
	}
	internal.Verbose("npx is available.")
	return true
}

// checkNpxPackage attempts to run a command like `npx <package> --version`
// to pre-install or verify the package is available.
func checkNpxPackage(pkg string) {
	internal.Verbose(fmt.Sprintf("Checking NPX package availability: %s", pkg))
	// Use -y to auto-confirm installation if needed.
	// Use --version as a simple, non-invasive command.
	// Some packages might not support --version, adjust if needed.
	args := []string{"-y", pkg, "--version"}
	// Suppress output unless in verbose mode
	if !internal.VerboseMode {
		// Attempt to suppress stdout/stderr for non-verbose runs
		// Note: npx can be noisy; this might not catch everything.
		// A more robust solution might involve specific flags if the package supports them.
	}

	err := internal.RunCmd("npx", args...)
	if err != nil {
		// Log as warning, as the package might still work fine when `start` is called
		// or might not support `--version`.
		if strings.Contains(err.Error(), "command not found") || strings.Contains(err.Error(), "failed") {
			internal.Log(fmt.Sprintf("Warning: Failed to pre-check/install NPX package '%s' (it might install on first use). Error: %v", pkg, err))
		} else {
			// Less severe error, maybe just didn't support --version
			internal.Verbose(fmt.Sprintf("NPX package check for '%s' command returned an error (may be normal): %v", pkg, err))
		}
	} else {
		internal.Verbose(fmt.Sprintf("NPX package '%s' appears to be available or was installed.", pkg))
	}
}
