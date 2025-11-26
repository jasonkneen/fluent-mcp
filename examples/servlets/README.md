# MCP Servlets

Servlets are lightweight, reusable MCP server components that provide focused functionality. They are designed to be minimal, easy to configure, and quick to deploy.

## What is a Servlet?

A **servlet** in the context of FluentMCP is a minimal, self-contained MCP server that:

- Provides a specific set of tools or capabilities
- Can be configured via command-line arguments
- Supports multiple transport options (stdio, SSE, or both)
- Is designed for quick deployment and easy integration

## Available Servlets

### Basic Servlets

| Servlet | Description | Transport |
|---------|-------------|-----------|
| `mcp-servlet.js` | Basic agent servlet with prompt/context handling | stdio |
| `mcp-servlet-sse.js` | SSE-based servlet for HTTP clients | SSE (HTTP) |
| `mcp-servlet-multi.js` | Multi-transport servlet (stdio + SSE) | Both |

### Example Servlets

| Servlet | Description | Use Case |
|---------|-------------|----------|
| `weather-servlet.js` | Weather information service | Weather data integration |
| `calculator-servlet.js` | Mathematical operations | Quick calculations |
| `file-manager-servlet.js` | File system operations | File management |
| `database-servlet.js` | In-memory database | Data storage |

## Usage

### Basic Usage

```bash
# Run with default settings
node mcp-servlet.js

# Run with custom configuration
node mcp-servlet.js --instruction "You are a helpful assistant" --prompt "How can I help?" --context "General assistance"
```

### With Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "my-servlet": {
      "command": "node",
      "args": ["/path/to/mcp-servlet.js", "--instruction", "Your agent role"]
    }
  }
}
```

### With SSE Transport

```bash
# Start SSE server
node mcp-servlet-sse.js --port 3000

# Connect from client
curl http://localhost:3000/health
```

## Creating Your Own Servlet

Use this template to create a new servlet:

```javascript
import { createMCP } from '@jasonkneen/fluent-mcp';
import { z } from 'zod';

createMCP('my-servlet', '1.0.0')
  // Add your tools
  .tool('myTool', {
    input: z.string().describe('Input parameter'),
  }, async ({ input }) => {
    return {
      content: [{ type: 'text', text: `Processed: ${input}` }]
    };
  })
  // Configure transport
  .stdio()
  // Start the server
  .start()
  .catch(console.error);
```

## Command Line Options

Most servlets support these common options:

| Option | Description | Default |
|--------|-------------|---------|
| `--instruction` | Agent role/instruction | Varies by servlet |
| `--prompt` | Default prompt text | Varies by servlet |
| `--context` | Context information | Varies by servlet |
| `--port` | HTTP port (SSE servlets) | 3000 |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Claude/Client  │────▶│    Servlet       │
└─────────────────┘     │  ┌────────────┐  │
                        │  │ FluentMCP  │  │
┌─────────────────┐     │  │  Server    │  │
│   HTTP Client   │────▶│  └────────────┘  │
└─────────────────┘     │       ▼          │
                        │  ┌────────────┐  │
                        │  │   Tools    │  │
                        │  └────────────┘  │
                        └──────────────────┘
```
