package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/khallmark/obsidian-magic/tools/magus-mcp/internal"
)

// RunStatus handles the status command
func RunStatus(args []string) error {
	if len(args) != 1 {
		return fmt.Errorf("status command requires exactly one argument: <server-name>")
	}
	serverName := args[0]

	// Load configuration
	config, err := internal.LoadMagusConfig("")
	if err != nil {
		return fmt.Errorf("could not load configuration to check server status: %w", err)
	}

	// Find the server config
	serverConfig, found := config.Servers[serverName]
	if !found {
		return fmt.Errorf("server configuration not found for: %s", serverName)
	}

	// Display server information
	fmt.Printf("MCP Server: %s\n", serverName)
	fmt.Println(strings.Repeat("-", 50))
	fmt.Printf("Runner: %s\n", serverConfig.Runner)

	switch serverConfig.Runner {
	case "npx":
		fmt.Printf("Package: %s\n", serverConfig.Package)
		if len(serverConfig.Args) > 0 {
			fmt.Printf("Arguments: %s\n", strings.Join(serverConfig.Args, " "))
		}
		// Check if package is available
		isAvailable := checkNpxPackageAvailability(serverConfig.Package)
		fmt.Printf("Package Availability: %s\n", formatAvailability(isAvailable))
	case "docker":
		fmt.Printf("Image: %s\n", serverConfig.Image)
		if len(serverConfig.Env) > 0 {
			fmt.Printf("Environment Variables: %s\n", strings.Join(serverConfig.Env, ", "))
		}
		if serverConfig.Network != "" {
			fmt.Printf("Network: %s\n", serverConfig.Network)
		}
		if serverConfig.Mount != nil {
			fmt.Printf("Mount: %s -> %s\n", serverConfig.Mount.Source, serverConfig.Mount.Destination)
		}
		// Check if image is available
		imageExists := checkDockerImageAvailability(serverConfig.Image)
		fmt.Printf("Image Availability: %s\n", formatAvailability(imageExists))
	default:
		fmt.Printf("Unknown runner type: %s\n", serverConfig.Runner)
	}

	// Check prerequisites
	fmt.Println(strings.Repeat("-", 50))
	fmt.Println("Prerequisites:")

	switch serverConfig.Runner {
	case "npx":
		npxAvailable := checkNpx()
		fmt.Printf("NPX Availability: %s\n", formatAvailability(npxAvailable))
	case "docker":
		dockerAvailable := checkDocker()
		fmt.Printf("Docker Availability: %s\n", formatAvailability(dockerAvailable))
	}

	// Look for potential running process (simplified check)
	fmt.Println(strings.Repeat("-", 50))
	fmt.Println("Process Status:")

	switch serverConfig.Runner {
	case "npx":
		// Simplified check - this is not fully reliable but gives a hint
		isRunning := checkForNpxProcess(serverConfig.Package)
		fmt.Printf("Running: %s\n", formatRunningState(isRunning))
	case "docker":
		// Check if a container with this image is running
		isRunning := checkForDockerContainer(serverConfig.Image)
		fmt.Printf("Running: %s\n", formatRunningState(isRunning))
	}

	return nil
}

// formatAvailability formats a boolean as "Available" or "Not Available"
func formatAvailability(available bool) string {
	if available {
		return "Available"
	}
	return "Not Available"
}

// formatRunningState formats a boolean as "Running" or "Not Running"
func formatRunningState(running bool) string {
	if running {
		return "Running"
	}
	return "Not Running"
}

// checkNpxPackageAvailability checks if an NPX package is available
func checkNpxPackageAvailability(pkg string) bool {
	internal.Verbose(fmt.Sprintf("Checking NPX package availability: %s", pkg))
	cmd := exec.Command("npx", "-p", pkg, "node", "-e", "console.log('ok')")
	cmd.Env = os.Environ()
	
	// Redirect output to /dev/null
	cmd.Stdout = nil
	cmd.Stderr = nil
	
	err := cmd.Run()
	return err == nil
}

// checkDockerImageAvailability checks if a Docker image exists locally
func checkDockerImageAvailability(image string) bool {
	internal.Verbose(fmt.Sprintf("Checking Docker image availability: %s", image))
	cmd := exec.Command("docker", "image", "inspect", "--format", "{{.ID}}", image)
	cmd.Stdout = nil
	cmd.Stderr = nil
	err := cmd.Run()
	return err == nil
}

// checkForNpxProcess uses ps to look for a process with the package name
// This is a simplified check and not 100% reliable
func checkForNpxProcess(pkg string) bool {
	// Basic process check - this is a simplification and may not be reliable
	cmd := exec.Command("ps", "aux")
	output, err := cmd.Output()
	if err != nil {
		internal.Verbose(fmt.Sprintf("Error checking for process: %v", err))
		return false
	}
	
	// Look for the package name in process list
	return strings.Contains(string(output), pkg)
}

// checkForDockerContainer checks if a container with the given image is running
func checkForDockerContainer(image string) bool {
	cmd := exec.Command("docker", "ps", "--format", "{{.Image}}")
	output, err := cmd.Output()
	if err != nil {
		internal.Verbose(fmt.Sprintf("Error checking for docker container: %v", err))
		return false
	}
	
	return strings.Contains(string(output), image)
} 