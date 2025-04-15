package internal

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

// VerboseMode controls verbose logging.
var VerboseMode bool

// ConfigPath holds the current config path
var ConfigPath string

// Constants for directories and files
const (
	MagusDir   = ".magus-mcp"
	CursorDir  = ".cursor"
	DefaultMagusConfigFile = MagusDir + "/magus-mcp.json"
	DefaultRootConfigFile = "magus-mcp.json"
	McpConfigFile   = CursorDir + "/mcp.json"
	EnvFile    = ".env"
)

func logMsg(prefix, msg string) {
	// Use ISO 8601 format for timestamps for better sorting/parsing
	fmt.Fprintf(os.Stderr, "[%s] %s %s\n", prefix, time.Now().Format(time.RFC3339), msg)
}

// Log writes a standard message to stderr.
func Log(msg string) {
	logMsg("magus-mcp", msg)
}

// Verbose writes a message to stderr if VerboseMode is enabled.
func Verbose(msg string) {
	if VerboseMode {
		logMsg("VERBOSE", msg)
	}
}

// Error writes an error message to stderr and exits.
// Consider returning errors instead of exiting directly in most internal functions.
func Error(msg string) {
	logMsg("ERROR", msg)
	os.Exit(1)
}

// Die is a convenience function to log an error message based on an error and exit.
func Die(msg string, err error) {
	Error(fmt.Sprintf("%s: %v", msg, err))
}

// RunCmd runs an external command, logs its execution (in verbose mode),
// and returns an error if it fails. It captures and logs combined output on error.
func RunCmd(name string, args ...string) error {
	Verbose(fmt.Sprintf("Executing command: %s %v", name, args))
	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Log the output only on error to avoid clutter
		Verbose(fmt.Sprintf("Command failed: %s\nOutput:\n%s", cmd.String(), string(output)))
		return fmt.Errorf("command '%s %v' failed: %w\nOutput: %s", name, args, err, string(output))
	} else {
		// Log success only in verbose mode
		Verbose(fmt.Sprintf("Command successful: %s", cmd.String()))
		// Optionally log output on success too if needed for detailed logs
		// Verbose(fmt.Sprintf("Output:\n%s", string(output)))
	}
	return nil
}

// CheckExecutable checks if an executable exists in the system's PATH.
func CheckExecutable(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

// GetConfigPath returns the effective config path, considering command line overrides
func GetConfigPath() string {
	if ConfigPath != "" {
		return ConfigPath
	}
	
	// First try the root config file (as requested by user)
	if _, err := os.Stat(DefaultRootConfigFile); err == nil {
		return DefaultRootConfigFile
	}
	
	// Fall back to the default in .magus-mcp directory
	return DefaultMagusConfigFile
}
