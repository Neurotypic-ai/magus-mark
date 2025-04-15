#!/bin/zsh

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]:-${(%):-%x}}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Enable better error reporting
set -e

# Load environment variables from .env file
if [ -f "$PROJECT_ROOT/.env" ]; then
    # Source the .env file to make variables available
    set -o allexport
    source "$PROJECT_ROOT/.env"
    set +o allexport
else
    echo "Warning: .env file not found in project root. Some servers might fail." >&2
fi

# Log function for consistent output
log() {
  echo "[MCP:$(date '+%H:%M:%S')] $1" >&2
}

# --- Argument Parsing ---
RUNNER=""
SERVER_NAME=""
IMAGE_OR_PACKAGE=""
MOUNT_SRC=""
MOUNT_DST=""
ENV_VARS_JSON="{}" # Default to empty JSON object
EXTRA_ARGS=()
NETWORK="host" # Default network mode for Docker

while [[ $# -gt 0 ]]; do
    case $1 in
        --runner)
            RUNNER="$2"
            shift # past argument
            shift # past value
            ;;
        --server-name)
            SERVER_NAME="$2"
            shift # past argument
            shift # past value
            ;;
        --image-package)
            IMAGE_OR_PACKAGE="$2"
            shift # past argument
            shift # past value
            ;;
        --mount)
            MOUNT_SRC="$2"
            MOUNT_DST="$3"
            shift # past argument
            shift # past value (src)
            shift # past value (dst)
            ;;
        --env)
             # Expecting a JSON string like '{"VAR1":"VAL1", "VAR2":"VAL2"}'
             # Or a single var like 'VAR_NAME' to pass from host
            if [[ "$2" == "{"* ]]; then
                 ENV_VARS_JSON="$2"
            else
                # Pass single env var from host
                ENV_VARS_JSON="$2" # Will be handled in docker case
            fi
            shift # past argument
            shift # past value
            ;;
        --network)
            NETWORK="$2"
            shift # past argument
            shift # past value
            ;;
        *)
            # Collect any remaining arguments as extra args for the server command
            EXTRA_ARGS+=("$1")
            shift # past argument
            ;;
    esac
done

# --- Runner Logic ---
log "Starting MCP Server: $SERVER_NAME ($RUNNER)"

case $RUNNER in
    docker)
        # Check if image exists first
        if ! docker image inspect "$IMAGE_OR_PACKAGE" &>/dev/null; then
            log "Docker image '$IMAGE_OR_PACKAGE' not found locally. Attempting to pull..."
            if ! docker pull "$IMAGE_OR_PACKAGE"; then
                # If the pull fails, we might be dealing with a local image that needs building
                if [[ "$IMAGE_OR_PACKAGE" == mcp/* ]]; then
                    log "Could not pull '$IMAGE_OR_PACKAGE'. This may be a local image that needs to be built."
                    log "Checking for Dockerfile in modelcontextprotocol/servers..."
                    
                    # Extract the server name from the image (e.g., mcp/git -> git)
                    SERVER_TYPE=$(echo "$IMAGE_OR_PACKAGE" | cut -d'/' -f2)
                    
                    # Check if modelcontextprotocol/servers exists
                    if [ -d "$PROJECT_ROOT/vendor/modelcontextprotocol/servers" ]; then
                        SERVERS_DIR="$PROJECT_ROOT/vendor/modelcontextprotocol/servers"
                    elif [ -d "$HOME/git/modelcontextprotocol/servers" ]; then
                        SERVERS_DIR="$HOME/git/modelcontextprotocol/servers"
                    else
                        log "Error: Could not find modelcontextprotocol/servers directory."
                        log "Please clone it from https://github.com/modelcontextprotocol/servers"
                        log "Or build the '$IMAGE_OR_PACKAGE' image manually."
                        exit 1
                    fi
                    
                    # Check if the server directory exists
                    if [ -d "$SERVERS_DIR/src/$SERVER_TYPE" ]; then
                        log "Found server directory at $SERVERS_DIR/src/$SERVER_TYPE"
                        if [ -f "$SERVERS_DIR/src/$SERVER_TYPE/Dockerfile" ]; then
                            log "Building Docker image $IMAGE_OR_PACKAGE from $SERVERS_DIR/src/$SERVER_TYPE/Dockerfile"
                            cd "$SERVERS_DIR/src/$SERVER_TYPE"
                            if ! docker build -t "$IMAGE_OR_PACKAGE" .; then
                                log "Error: Failed to build Docker image '$IMAGE_OR_PACKAGE'"
                                exit 1
                            fi
                            cd - > /dev/null
                        else
                            log "Error: Dockerfile not found in $SERVERS_DIR/src/$SERVER_TYPE"
                            exit 1
                        fi
                    else
                        log "Error: Server directory not found at $SERVERS_DIR/src/$SERVER_TYPE"
                        exit 1
                    fi
                else
                    log "Error: Could not pull Docker image '$IMAGE_OR_PACKAGE'"
                    exit 1
                fi
            fi
        fi

        DOCKER_CMD=("docker" "run" "--rm" "-i" "--network" "$NETWORK")

        # Add mount if specified
        if [ -n "$MOUNT_SRC" ] && [ -n "$MOUNT_DST" ]; then
             # Resolve relative paths for source based on project root
             if [[ "$MOUNT_SRC" != /* ]]; then
                 MOUNT_SRC="$PROJECT_ROOT/$MOUNT_SRC"
             fi
             # Handle ${PWD} in the source path
             MOUNT_SRC=$(echo "$MOUNT_SRC" | sed "s|\${PWD}|$PWD|g")
             
             # Ensure source directory exists if it's for data persistence
             if [[ "$MOUNT_DST" == /data* ]]; then
                 mkdir -p "$MOUNT_SRC"
             fi
             DOCKER_CMD+=("--mount" "type=bind,src=$MOUNT_SRC,dst=$MOUNT_DST")
        fi

        # Add environment variables
        if [[ "$ENV_VARS_JSON" == "{"* ]]; then # Full JSON provided
            # Use jq to iterate over the JSON and add --env flags
            # Check if jq is installed
            if ! command -v jq &> /dev/null; then
                log "Error: jq is required for parsing JSON env vars. Please install jq."
                log "Run: brew install jq"
                exit 1
            fi
            while IFS='=' read -r key value; do
                # Remove quotes from key and value
                key=$(echo $key | jq -r '.')
                value=$(echo $value | jq -r '.')
                # Expand any environment variables in the value
                value=$(eval echo "$value")
                DOCKER_CMD+=("--env" "$key=$value")
            done < <(echo "$ENV_VARS_JSON" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')
        elif [ -n "$ENV_VARS_JSON" ]; then # Single host variable name provided
             DOCKER_CMD+=("--env" "$ENV_VARS_JSON")
        fi

        # Add image/package name
        DOCKER_CMD+=("$IMAGE_OR_PACKAGE")

        # Add extra arguments
        if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
            DOCKER_CMD+=("${EXTRA_ARGS[@]}")
        fi

        log "Executing: ${DOCKER_CMD[@]}"
        exec "${DOCKER_CMD[@]}"
        ;;

    uvx)
        # First, check if uvx is installed
        if ! command -v uvx &> /dev/null; then
            log "Error: uvx is not installed. Please install uv tools first."
            log "Run: pip install uv"
            exit 1
        fi
        
        # Placeholder for uvx runner - adapt as needed
        UVX_CMD=("uvx" "$IMAGE_OR_PACKAGE")
        
        # Add environment variables if needed (uvx might handle differently)
        # For now, just export them to the environment
        if [[ "$ENV_VARS_JSON" == "{"* ]]; then
            if ! command -v jq &> /dev/null; then
                log "Error: jq is required for parsing JSON env vars. Please install jq."
                log "Run: brew install jq"
                exit 1
            fi
            while IFS='=' read -r key value; do
                # Remove quotes from key and value
                key=$(echo $key | jq -r '.')
                value=$(echo $value | jq -r '.')
                # Expand any environment variables in the value
                value=$(eval echo "$value")
                export "$key=$value"
            done < <(echo "$ENV_VARS_JSON" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')
        fi
        
        # Add extra arguments
        if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
            UVX_CMD+=("${EXTRA_ARGS[@]}")
        fi

        log "Executing: ${UVX_CMD[@]}"
        # Need to handle env vars for uvx if applicable
        exec "${UVX_CMD[@]}"
        ;;

    node)
        # Check if Node.js is installed
        if ! command -v node &> /dev/null; then
            log "Error: Node.js is not installed. Please install Node.js first."
            exit 1
        fi
        
        # Placeholder for node runner - adapt as needed
        NODE_CMD=("node" "$IMAGE_OR_PACKAGE")
        
        # Add environment variables
        if [[ "$ENV_VARS_JSON" == "{"* ]]; then
            if ! command -v jq &> /dev/null; then
                log "Error: jq is required for parsing JSON env vars. Please install jq."
                log "Run: brew install jq"
                exit 1
            fi
            while IFS='=' read -r key value; do
                # Remove quotes from key and value
                key=$(echo $key | jq -r '.')
                value=$(echo $value | jq -r '.')
                # Expand any environment variables in the value
                value=$(eval echo "$value")
                export "$key=$value"
            done < <(echo "$ENV_VARS_JSON" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')
        fi
        
        # Add extra arguments
        if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
            NODE_CMD+=("${EXTRA_ARGS[@]}")
        fi

        log "Executing: ${NODE_CMD[@]}"
        exec "${NODE_CMD[@]}"
        ;;

    npx)
        # Check if npx is installed
        if ! command -v npx &> /dev/null; then
            log "Error: npx is not installed. Please install Node.js/npm first."
            exit 1
        fi
        
        # For npx, the image_or_package is the package name
        NPX_CMD=("npx")
        
        # Add -y to always say yes to installs
        NPX_CMD+=("-y")
        
        # Add the package name
        NPX_CMD+=("$IMAGE_OR_PACKAGE")
        
        # Add environment variables
        if [[ "$ENV_VARS_JSON" == "{"* ]]; then
            if ! command -v jq &> /dev/null; then
                log "Error: jq is required for parsing JSON env vars. Please install jq."
                log "Run: brew install jq"
                exit 1
            fi
            while IFS='=' read -r key value; do
                # Remove quotes from key and value
                key=$(echo $key | jq -r '.')
                value=$(echo $value | jq -r '.')
                # Expand any environment variables in the value
                value=$(eval echo "$value")
                export "$key=$value"
            done < <(echo "$ENV_VARS_JSON" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')
        fi
        
        # Add extra arguments
        if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
            NPX_CMD+=("${EXTRA_ARGS[@]}")
        fi

        log "Executing: ${NPX_CMD[@]}"
        exec "${NPX_CMD[@]}"
        ;;

    # Add more runners here (e.g., python -m, direct executable)

    *)
        log "Error: Unsupported runner type '$RUNNER' for server '$SERVER_NAME'"
        exit 1
        ;;
esac 