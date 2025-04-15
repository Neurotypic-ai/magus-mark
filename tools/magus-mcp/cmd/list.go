package cmd

import (
	"fmt"
	"strings"

	"github.com/khallmark/obsidian-magic/tools/magus-mcp/internal"
)

// RunList handles the list command
func RunList(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("list command takes no arguments")
	}

	// Load configuration
	config, err := internal.LoadMagusConfig("")
	if err != nil {
		return fmt.Errorf("could not load configuration to list servers: %w", err)
	}

	if len(config.Servers) == 0 {
		fmt.Println("No MCP servers configured.")
		return nil
	}

	// Display information about each server
	fmt.Printf("MCP Servers (config version: %s)\n", config.Version)
	fmt.Println(strings.Repeat("-", 50))
	fmt.Printf("%-20s | %-10s | %s\n", "NAME", "RUNNER", "DETAILS")
	fmt.Println(strings.Repeat("-", 50))

	for name, server := range config.Servers {
		var details string
		switch server.Runner {
		case "npx":
			details = fmt.Sprintf("Package: %s", server.Package)
			if len(server.Args) > 0 {
				details += fmt.Sprintf(", Args: %s", strings.Join(server.Args, " "))
			}
		case "docker":
			details = fmt.Sprintf("Image: %s", server.Image)
			if len(server.Env) > 0 {
				details += fmt.Sprintf(", Env: %s", strings.Join(server.Env, ", "))
			}
		default:
			details = "Unknown runner type"
		}

		fmt.Printf("%-20s | %-10s | %s\n", name, server.Runner, details)
	}

	return nil
} 