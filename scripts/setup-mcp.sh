#!/bin/zsh

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]:-${(%):-%x}}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Log function for consistent output
log() {
  echo "[MCP Setup:$(date '+%H:%M:%S')] $1" >&2
}

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    log "Error: Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    log "Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    log "jq is not installed. This is needed for parsing JSON. Installing with Homebrew..."
    if command -v brew &> /dev/null; then
        brew install jq
    else
        log "Error: Homebrew is not installed and jq is required. Please install jq manually."
        exit 1
    fi
fi

# Pull Docker images
log "Pulling Docker images..."
docker pull ghcr.io/github/github-mcp-server:latest || log "Warning: Failed to pull GitHub MCP server image"

# Check for NPM dependencies
log "Checking NPM dependencies..."
if ! command -v npx &> /dev/null; then
    log "Error: npx is not installed. Please install Node.js/npm first."
    exit 1
fi

# Pre-install npm packages to avoid delays during MCP server startup
log "Pre-installing NPM packages..."
log "Installing @modelcontextprotocol/server-memory..."
npx -y @modelcontextprotocol/server-memory --version || log "Warning: Failed to pre-install memory MCP server"

log "Installing @modelcontextprotocol/server-sequential-thinking..."
npx -y @modelcontextprotocol/server-sequential-thinking --version || log "Warning: Failed to pre-install sequential-thinking MCP server"

log "Installing @modelcontextprotocol/server-filesystem..."
npx -y @modelcontextprotocol/server-filesystem --version || log "Warning: Failed to pre-install filesystem MCP server"

log "Installing mcp-server-git..."
npx -y mcp-server-git --version || log "Warning: Failed to pre-install git MCP server"

log "Installing mcp-obsidian..."
npx -y mcp-obsidian --version || log "Warning: Failed to pre-install Obsidian MCP server"

# Ensure .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    log "Creating .env file from template..."
    if [ -f "$PROJECT_ROOT/.env.template" ]; then
        cp "$PROJECT_ROOT/.env.template" "$PROJECT_ROOT/.env"
        log "Please edit $PROJECT_ROOT/.env to set your actual API keys and paths."
    else
        log "Warning: No .env.template found. Creating a minimal .env file."
        cat > "$PROJECT_ROOT/.env" << EOF
# MCP Server Environment Variables
GITHUB_TOKEN=your_github_token_here
OBSIDIAN_API_KEY=your_obsidian_api_key_here
OBSIDIAN_HOST=http://localhost:27123

# Add other environment variables as needed
EOF
        log "Please edit $PROJECT_ROOT/.env with your actual values."
        log "Note: To get your Obsidian API key, install the Local REST API plugin in Obsidian"
        log "and look for the API key in the plugin settings."
    fi
fi

# Make our scripts executable
chmod +x "$SCRIPT_DIR/start-mcp.sh"

log "Setup complete! You can now use the MCP servers in Cursor."
log "To update an MCP server, use the Cursor MCP settings page." 