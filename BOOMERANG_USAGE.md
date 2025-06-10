# Boomerang Task Usage Guide

## Setup

1. Add the server to your MCP configuration:
```json
{
  "mcpServers": {
    "boomerang-task": {
      "command": "node",
      "args": ["./src/boomerang-mcp.js"],
      "env": {}
    }
  }
}
```

2. Start the server:
```bash
node ./src/boomerang-mcp.js
```

## Usage

### Option 1: Manual Workflow (3 steps)

1. **Before starting a task:**
```
Use MCP tool: before_request
Server: boomerang-task
Arguments:
{
  "task_id": "unique_task_123",
  "user_prompt": "Create a todo app",
  "context": "Using React and TypeScript"
}
```

2. **Execute your main task** (any work you need to do)

3. **After completing the task:**
```
Use MCP tool: after_request
Server: boomerang-task
Arguments:
{
  "task_id": "unique_task_123",
  "result": "Successfully created todo app with React",
  "success": true,
  "duration_ms": 30000
}
```

### Option 2: Configured Workflow (1 step)

Use the `execute_boomerang_task` tool to set up the complete workflow:

```
Use MCP tool: execute_boomerang_task
Server: boomerang-task
Arguments:
{
  "user_prompt": "Create a todo app",
  "pre_request_mcp_server": "example-server",
  "pre_request_tool": "createNote",
  "post_request_mcp_server": "example-server", 
  "post_request_tool": "updateNote",
  "context": "Using React and TypeScript"
}
```

This returns a workflow configuration with step-by-step instructions.

## Example Integration

```javascript
// Before your task
const beforeResult = await mcpClient.callTool('boomerang-task', 'before_request', {
  task_id: 'task_001',
  user_prompt: 'Build homepage',
  context: 'Next.js project'
});

// Your main work here...

// After your task
const afterResult = await mcpClient.callTool('boomerang-task', 'after_request', {
  task_id: 'task_001', 
  result: 'Homepage completed successfully',
  success: true,
  duration_ms: 15000
});