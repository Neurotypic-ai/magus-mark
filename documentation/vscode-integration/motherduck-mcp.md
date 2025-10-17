# MotherDuck MCP Server Integration

## Overview

The [MotherDuck MCP Server](https://github.com/motherduckdb/mcp-server-motherduck) enables Cursor AI to query DuckDB
databases directly. In this workspace, it's configured to query the TypeScript Viewer's DuckDB database in **read-only**
and **SaaS mode** for security.

---

## Configuration

### Cursor Setup (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "motherduck": {
      "command": "uvx",
      "args": [
        "mcp-server-motherduck",
        "--db-path",
        "/Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/packages/magus-typescript-viewer/typescript-viewer.duckdb",
        "--read-only",
        "--saas-mode"
      ]
    }
  }
}
```

**Security Features:**

- `--read-only`: Prevents writes to the database (short-lived connections)
- `--saas-mode`: Restricts access to local files, extensions, and system configurations

---

## Prerequisites

1. **Install `uvx`** (Python package executor):

   ```bash
   pip install uv
   # or
   brew install uv
   ```

2. **Verify installation**:

   ```bash
   uvx --version
   ```

3. **Restart Cursor** after configuration changes

---

## Usage

### Basic Queries

Ask Cursor AI to query your TypeScript Viewer database:

```text
@motherduck Show me all tables in the database
```

```text
@motherduck Query the top 10 packages by dependency count
```

```text
@motherduck Analyze the module structure for the core package
```

### Example Queries

**List all tables:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'main';
```

**Inspect package metadata:**

```sql
SELECT * FROM packages LIMIT 10;
```

**Complex analysis:**

```sql
SELECT
  p.name,
  COUNT(DISTINCT d.dependency_id) as dep_count
FROM packages p
LEFT JOIN dependencies d ON p.id = d.package_id
GROUP BY p.name
ORDER BY dep_count DESC;
```

---

## Alternative Connection Modes

### MotherDuck Cloud (with token)

For querying MotherDuck's cloud service:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "motherduck_token",
      "description": "MotherDuck Token",
      "password": true
    }
  ],
  "servers": {
    "motherduck": {
      "command": "uvx",
      "args": [
        "mcp-server-motherduck",
        "--db-path",
        "md:",
        "--motherduck-token",
        "${input:motherduck_token}",
        "--saas-mode"
      ]
    }
  }
}
```

**Read-Scaling Token (Recommended for Production):**

- Create a read-scaling token in MotherDuck console
- Enables up to 4 concurrent read replicas
- Prevents write operations
- See: [MotherDuck Read Scaling Docs](https://motherduck.com/docs/read-scaling)

### In-Memory Database (Testing)

For quick prototyping:

```json
{
  "mcpServers": {
    "motherduck": {
      "command": "uvx",
      "args": ["mcp-server-motherduck", "--db-path", ":memory:"]
    }
  }
}
```

### S3-Backed Database

For cloud-stored DuckDB files:

```json
{
  "mcpServers": {
    "motherduck": {
      "command": "uvx",
      "args": ["mcp-server-motherduck", "--db-path", "s3://your-bucket/path/to/database.duckdb"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${env:AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${env:AWS_SECRET_ACCESS_KEY}",
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }
  }
}
```

---

## Troubleshooting

### "uvx not found"

**Solution:**

```bash
# Install uv package manager
pip install uv
# or
brew install uv

# Verify installation
which uvx
```

If installed but not found, add to `.cursor/mcp.json`:

```json
{
  "command": "/full/path/to/uvx",
  "args": ["..."]
}
```

### "Database is locked"

**Cause:** Another process has the database open for writing.

**Solution:**

- The `--read-only` flag uses short-lived connections to avoid locks
- Ensure DBT/other writers close connections properly
- Check for lingering processes: `lsof | grep typescript-viewer.duckdb`

### "Permission denied"

**Cause:** File permissions issue.

**Solution:**

```bash
chmod 644 /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/packages/magus-typescript-viewer/typescript-viewer.duckdb
```

### "MCP server failed to start"

**Solutions:**

1. Restart Cursor
2. Check configuration syntax in `.cursor/mcp.json`
3. Verify `uvx` is in PATH
4. Check Cursor logs: Help → Toggle Developer Tools → Console

---

## Advanced: Local SSE Mode (Development)

For debugging or custom integrations, run the server in SSE mode:

### Direct SSE Mode

```bash
uvx mcp-server-motherduck \
  --transport sse \
  --port 8000 \
  --db-path /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/packages/magus-typescript-viewer/typescript-viewer.duckdb \
  --read-only \
  --saas-mode
```

Point clients to: `http://localhost:8000/sse`

### Using Supergateway

```bash
npx -y supergateway --stdio "uvx mcp-server-motherduck \
  --db-path /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/packages/magus-typescript-viewer/typescript-viewer.duckdb \
  --read-only \
  --saas-mode"
```

---

## Security Best Practices

### For Local Development (Current Setup)

✅ **`--read-only`** - Prevents accidental data modification  
✅ **`--saas-mode`** - Limits filesystem and extension access  
✅ **Absolute paths** - No ambiguous file resolution

### For Production/Third-Party Access

✅ **Read-Scaling Tokens** - Use MotherDuck read-scaling tokens (not primary tokens)  
✅ **`--saas-mode`** - Always enabled for third-party tools  
✅ **Token Rotation** - Rotate tokens periodically  
✅ **Audit Logs** - Monitor query patterns in MotherDuck console

### Risk Matrix

| Mode                          | Write Risk | File Access | Extension Access | Recommended For            |
| ----------------------------- | ---------- | ----------- | ---------------- | -------------------------- |
| Default                       | High       | Full        | Full             | ❌ Not recommended         |
| `--read-only`                 | Low        | Full        | Full             | ⚠️ Trusted users only      |
| `--saas-mode`                 | High       | None        | None             | ⚠️ Read-only cloud only    |
| `--read-only` + `--saas-mode` | None       | None        | None             | ✅ Production, third-party |

---

## Integration with Magus Mark

The MotherDuck MCP server complements the existing `@magus-mark` participant:

| Server        | Purpose                         | Tools                         |
| ------------- | ------------------------------- | ----------------------------- |
| `@magus-mark` | Obsidian vault & tagging        | Tag analysis, knowledge graph |
| `@motherduck` | TypeScript codebase SQL queries | DuckDB queries, analytics     |
| `nx-mcp`      | Nx workspace operations         | Build, test, graph            |

**Combined Workflow Example:**

1. Query TypeScript structure with `@motherduck`
2. Analyze code patterns with `@magus-mark`
3. Tag relevant documentation in Obsidian
4. Build affected projects with `@nx-mcp`

---

## Resources

- [MotherDuck MCP Server GitHub](https://github.com/motherduckdb/mcp-server-motherduck)
- [Model Context Protocol Spec](https://spec.modelcontextprotocol.io/)
- [DuckDB Documentation](https://duckdb.org/docs/)
- [MotherDuck Documentation](https://motherduck.com/docs/)
- [uv Package Manager](https://github.com/astral-sh/uv)

---

## Verification

After configuration, verify the setup:

1. **Restart Cursor**
2. **Check MCP status** in Cursor settings
3. **Run test query:**

   ```text
   @motherduck SELECT 'Hello from DuckDB!' as message;
   ```

4. **Inspect schema:**

   ```text
   @motherduck PRAGMA show_tables;
   ```

5. **Query metadata:**

   ```text
   @motherduck SELECT * FROM information_schema.tables;
   ```

If all queries succeed, the integration is working correctly.

---

Your Humble Servant, Sebastien
