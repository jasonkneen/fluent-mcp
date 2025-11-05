# Fluent MCP

![alt text](fluentMCP.png)

A chainable, fluent interface for building Model Context Protocol (MCP) servers and clients with minimal code. This library provides a jQuery-like API for creating MCP servers with built-in CRUD operations and resource management, as well as lightweight MCP clients for communicating with MCP servers.

## Features

- **Chainable API**: Create and configure MCP servers and clients with a fluent, chainable interface
- **Built-in CRUD Operations**: Automatically generate CRUD tools for your resources
- **Resource Management**: Easily manage resources with built-in storage
- **Client Support**: Create MCP clients with the same familiar API
- **Multiple Transports**: Support for stdio, SSE, and HTTP transports
- **Transport Chaining**: Run multiple transports simultaneously on the same server
- **Flexible Configuration**: Simple by default, but customizable when needed
- **TypeScript Support**: Full TypeScript declarations for type safety
- **JavaScript Compatibility**: Works in both TypeScript and JavaScript environments

## Installation

```bash
npm install @jasonkneen/fluent-mcp
```

## Quick Start

```bash
# Run the demo server
npm start
```

## Configuration Options

The `createMCP` function accepts an optional `options` parameter for customization:

```javascript
import { createMCP } from '@jasonkneen/fluent-mcp';

// Simple usage with defaults
const simpleServer = createMCP('Notes API', '1.0.0');

// Advanced usage with custom options
const advancedServer = createMCP('Notes API', '1.0.0', {
  autoGenerateIds: false,     // Default: true - Set to false to manually manage IDs
  timestampEntries: false,    // Default: true - Set to false to disable automatic timestamps
  customOption: 'value'       // Any additional custom options
});
```

### Available Options:
- **`autoGenerateIds`** (boolean, default: `true`): Automatically generate random IDs for CRUD operations
- **`timestampEntries`** (boolean, default: `true`): Automatically add `createdAt`/`updatedAt` timestamps
- **Custom options**: Any additional options you need for your specific use case

## Using the Fluent MCP Server Interface

### Simple Usage

There are multiple ways to use Zod with FluentMCP for schema validation:

#### Option 1: Import Zod separately (traditional approach)

```javascript
import { createMCP, z } from '@jasonkneen/fluent-mcp';

// Create a new MCP server with fluent interface
const server = createMCP('Notes API', '1.0.0')
  // Define the Notes resource and CRUD operations
  .resource('Notes', {})
  .crud('Note', {
    title: z.string().describe('The title of the note'),
    content: z.string().describe('The content of the note'),
    tags: z.array(z.string()).optional().describe('Optional tags for the note')
  })
```

#### Option 2: Use the built-in `.z` property

```javascript
import { createMCP } from '@jasonkneen/fluent-mcp';

// Create a new MCP server with fluent interface
const server = createMCP('Notes API', '1.0.0');

// Use the built-in .z property for schema validation
server
  .resource('Notes', {})
  .crud('Note', {
    title: server.z.string().describe('The title of the note'),
    content: server.z.string().describe('The content of the note'),
    tags: server.z.array(server.z.string()).optional().describe('Optional tags for the note')
  })
```

#### Option 3: Use the built-in `.schema` property (alternative name)

```javascript
import { createMCP } from '@jasonkneen/fluent-mcp';

// Create a new MCP server with fluent interface
const server = createMCP('Notes API', '1.0.0');

// Use the built-in .schema property for schema validation
server
  .resource('Notes', {})
  .crud('Note', {
    title: server.schema.string().describe('The title of the note'),
    content: server.schema.string().describe('The content of the note'),
    tags: server.schema.array(server.schema.string()).optional().describe('Optional tags for the note')
  })
```

#### Option 4: Destructure for cleaner code

```javascript
import { createMCP } from '@jasonkneen/fluent-mcp';

// Create a new MCP server with fluent interface
const server = createMCP('Notes API', '1.0.0');
const { z } = server;  // or const { schema } = server;

server
  .resource('Notes', {})
  .crud('Note', {
    title: z.string().describe('The title of the note'),
    content: z.string().describe('The content of the note'),
    tags: z.array(z.string()).optional().describe('Optional tags for the note')
  })
  
  // Add a custom search tool
  .tool(
    'searchNotes',
    {
      query: z.string().describe('The search query')
    },
    async ({ query }) => {
      // Implementation...
    }
  )
  
  // Enable stdio transport and start the server
  .stdio()
  .start();
```

### Advanced Usage

```javascript
import { createMCP, z } from '@jasonkneen/fluent-mcp';

// Create a new MCP server with advanced options
const server = createMCP('Task Manager API', '1.0.0', {
  autoGenerateIds: false,  // We'll manage IDs ourselves
  timestampEntries: false  // No automatic timestamps
})
  // Define resources with custom options
  .resource('Tasks', {})
  .crud('Task', {
    id: z.string().describe('The unique ID of the task'),
    title: z.string().describe('The title of the task'),
    // ...more fields
  }, {
    singularName: 'Task',
    pluralName: 'Tasks'  // Explicit pluralization
  })
  
  // Start the server
  .start();
```

## Transport Options

FluentMCP supports multiple transport mechanisms and can run them simultaneously.

### Stdio Transport

The stdio transport is the default and is used for command-line MCP servers.

```javascript
import { createMCP } from '@jasonkneen/fluent-mcp';

const server = createMCP('My Server', '1.0.0')
  .tool('hello', { name: server.z.string() }, async ({ name }) => ({
    content: [{ type: 'text', text: `Hello, ${name}!` }]
  }))
  .stdio()
  .start();
```

### SSE Transport (Server-Sent Events)

SSE transport enables real-time communication over HTTP. This is ideal for web-based MCP clients.

```javascript
import express from 'express';
import { createMCP } from '@jasonkneen/fluent-mcp';

const app = express();
app.use(express.json());

// SSE endpoint
app.get('/sse', async (req, res) => {
  const server = createMCP('SSE Server', '1.0.0')
    .tool('getData', {}, async () => ({
      content: [{ type: 'text', text: 'Data from SSE transport' }]
    }))
    .sse('/messages', res)
    .start();
});

app.listen(3000, () => {
  console.log('SSE server running on http://localhost:3000/sse');
});
```

### Multiple Transports (Chaining)

You can run multiple transports simultaneously on the same MCP server instance. This allows clients to connect via different methods while sharing the same tools and resources.

```javascript
import express from 'express';
import { createMCP } from '@jasonkneen/fluent-mcp';

const app = express();

// Create a single server instance
function createServerInstance() {
  return createMCP('Multi-Transport Server', '1.0.0')
    .resource('Data', {})
    .crud('Item', {
      name: server.z.string(),
      value: server.z.string()
    })
    .tool('customTool', { query: server.z.string() }, async ({ query }) => ({
      content: [{ type: 'text', text: `Processed: ${query}` }]
    }));
}

// SSE endpoint
app.get('/sse', async (req, res) => {
  await createServerInstance().sse('/messages', res).start();
});

// Stdio transport (runs in parallel)
if (!process.stdin.isTTY) {
  createServerInstance().stdio().start();
}

app.listen(3000);
```

Both transports will have access to the same tools and resources!

## Using the Fluent MCP Client Interface

### Simple Usage

```javascript
import { createMCPClient } from '@jasonkneen/fluent-mcp';

// Create an MCP client with fluent API
const client = createMCPClient('Notes Client', '1.0.0')
  // Configure connection to an MCP server over stdio
  .stdio('node', ['path/to/server.js'])
  // Connect to the server
  .connect();
  
// Call server tools
const result = await client.callTool('searchNotes', { query: 'example' });
console.log(client.parseToolResult(result)); // Parse JSON response
```

### HTTP Client

```javascript
import { createMCPClient } from '@jasonkneen/fluent-mcp';

// Create an HTTP client
const client = createMCPClient('Notes HTTP Client', '1.0.0')
  // Configure HTTP connection
  .http('http://localhost:3000/mcp')
  // Connect to the server
  .connect();

// List available tools
const tools = await client.listTools();
console.log(tools);

// Disconnect when done
await client.disconnect();
```

### SSE Client

```javascript
import { createMCPClient } from '@jasonkneen/fluent-mcp';

// Create an SSE client
const client = createMCPClient('Notes SSE Client', '1.0.0')
  // Configure SSE connection
  .sse('http://localhost:3000/sse')
  // Connect to the server
  .connect();

// Call tools
const result = await client.callTool('getData', {});
console.log(client.parseToolResult(result));

// Disconnect when done
await client.disconnect();
```

### Advanced Client Usage

```javascript
import { createMCPClient, LoggingMessageNotificationSchema } from '@jasonkneen/fluent-mcp';

// Create a client with notification handlers
const client = createMCPClient('Notes Client', '1.0.0')
  // Register notification handler
  .onNotification(LoggingMessageNotificationSchema, (notification) => {
    console.log(`Server notification: ${notification.params.level} - ${notification.params.data}`);
  })
  // Register error handler
  .onError((error) => {
    console.error('Client error:', error);
  })
  // Configure connection
  .stdio('node', ['path/to/server.js']);

// Connect and use the client
await client.connect();

// Use helper methods
const resources = await client.listResources();
const prompts = await client.listPrompts();
const promptTemplate = await client.getPrompt('examplePrompt', { param: 'value' });

// Disconnect when done
await client.disconnect();
```

## Running the Demos

### Server Demos

```bash
npm start            # Run the JavaScript demo server
# or
npm run demo         # Same as above
npm run demo:ts      # Run the TypeScript demo server
npm run demo:sse     # Run the SSE server demo (with multiple transports)
```

### Client Demos

```bash
npm run demo:client       # Run the stdio client demo
npm run demo:http-client  # Run the HTTP client demo
npm run demo:sse-client   # Run the SSE client demo
```

## Available Methods

### Core Methods

- `createMCP(name, version, options)`: Create a new FluentMCP server instance with flexible configuration options
- `createMCPClient(name, version, options)`: Create a new FluentMCPClient instance with flexible configuration options
- `connectMCPClient(name, version, transportConfig)`: Create and connect a client in one step
- `z`: Re-exported Zod library for schema definitions (no need to install Zod separately)

### Server Methods

- `resource(name, initialData)`: Initialize a resource store
- `getResource(name)`: Get a resource store
- `setResource(name, id, data)`: Set a resource value
- `deleteResource(name, id)`: Delete a resource value
- `crud(resourceName, schema, options)`: Create CRUD operations for a resource
- `tool(name, schema, handler)`: Add a tool to the server
- `stdio()`: Enable stdio transport
- `sse(endpoint, res)`: Enable SSE transport
- `start()`: Start the server with the configured transport(s)

### Client Methods

- `onError(handler)`: Register an error handler
- `onNotification(schema, handler)`: Register a notification handler
- `stdio(command, args, options)`: Configure stdio transport
- `http(url, options)`: Configure HTTP transport
- `sse(url, options)`: Configure SSE transport
- `callTool(name, args, resultSchema)`: Call a tool on the MCP server
- `listTools()`: List available tools on the server
- `listResources()`: List available resources on the server
- `listPrompts()`: List available prompts on the server
- `getPrompt(name, args)`: Get a prompt from the server
- `parseToolResult(result)`: Parse a tool result into JSON
- `connect()`: Connect to the MCP server
- `disconnect()`: Disconnect from the MCP server

## Testing

Run the tests with:

```bash
npm test
```

Or watch mode:

```bash
npm run test:watch
```

## Customizing

You can extend the FluentMCP class with your own methods to add additional functionality. The chainable design makes it easy to add new capabilities while maintaining a clean API.