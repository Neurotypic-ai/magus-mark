package cmd

import (
	"flag"
	"fmt"
	"os"

	"github.com/khallmark/obsidian-magic/tools/magus-mcp/internal"
)

var (
	verbose bool
	configPath string
	
	// Create a separate flagset for global flags to prevent interference with command arguments
	globalFlags = flag.NewFlagSet("global", flag.ExitOnError)
)

// Execute is the main entry point for the CLI
func Execute() error {
	// Define global flags
	globalFlags.BoolVar(&verbose, "verbose", false, "Enable verbose logging")
	globalFlags.BoolVar(&verbose, "v", false, "Enable verbose logging (shorthand)")
	globalFlags.StringVar(&configPath, "config", "", "Specify config file path")
	globalFlags.StringVar(&configPath, "c", "", "Specify config file path (shorthand)")

	// Custom usage message
	globalFlags.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: %s [options] <command> [args]\n\n", os.Args[0])
		fmt.Fprintln(os.Stderr, "Commands:")
		fmt.Fprintln(os.Stderr, "  init      Initialize environment")
		fmt.Fprintln(os.Stderr, "  install   Install dependencies")
		fmt.Fprintln(os.Stderr, "  list      List configured MCP servers")
		fmt.Fprintln(os.Stderr, "  status    Check status of an MCP server")
		fmt.Fprintln(os.Stderr, "  start     Start an MCP server")
		fmt.Fprintln(os.Stderr, "\nGlobal Options:")
		globalFlags.PrintDefaults()
	}

	// If no args provided, show usage
	if len(os.Args) < 2 {
		globalFlags.Usage()
		return fmt.Errorf("no command specified")
	}

	// Find the command position and parse flags before it
	cmdPos := 1
	for i := 1; i < len(os.Args); i++ {
		if !isFlag(os.Args[i]) {
			cmdPos = i
			break
		}
	}

	// Parse global flags before the command
	if err := globalFlags.Parse(os.Args[1:cmdPos]); err != nil {
		return fmt.Errorf("error parsing global flags: %w", err)
	}

	// Set verbose mode and config path in the internal package
	internal.VerboseMode = verbose
	internal.ConfigPath = configPath
	
	if verbose {
		internal.Verbose("Verbose mode enabled")
	}
	
	if configPath != "" {
		internal.Verbose(fmt.Sprintf("Using config file: %s", configPath))
	} else {
		internal.Verbose(fmt.Sprintf("Using default config lookup path (first found): %s", internal.GetConfigPath()))
	}

	// Get the command and its arguments
	if cmdPos >= len(os.Args) {
		globalFlags.Usage()
		return fmt.Errorf("no command specified")
	}
	
	command := os.Args[cmdPos]
	commandArgs := []string{}
	if cmdPos+1 < len(os.Args) {
		commandArgs = os.Args[cmdPos+1:]
	}

	internal.Verbose(fmt.Sprintf("Executing command: %s with args: %v", command, commandArgs))

	// Dispatch to the appropriate subcommand
	switch command {
	case "init":
		return RunInit(commandArgs)
	case "install":
		return RunInstall(commandArgs)
	case "list":
		return RunList(commandArgs)
	case "status":
		return RunStatus(commandArgs)
	case "start":
		return RunStart(commandArgs)
	default:
		globalFlags.Usage()
		return fmt.Errorf("unknown command: %s", command)
	}
}

// isFlag determines if an argument is a flag (starts with - or --)
func isFlag(arg string) bool {
	return len(arg) > 0 && arg[0] == '-'
}
