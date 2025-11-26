import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Create mock functions at module level
const mockToolFn = vi.fn();
const mockConnectFn = vi.fn().mockResolvedValue(undefined);
const mockSetRequestHandler = vi.fn();

// Mock the McpServer class
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(() => {
      return {
        tool: mockToolFn,
        connect: mockConnectFn,
        server: {
          setRequestHandler: mockSetRequestHandler
        }
      };
    })
  };
});

// Mock the StdioServerTransport class
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: vi.fn().mockImplementation(() => {
      return {};
    })
  };
});

// Mock the SSEServerTransport class
vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
  return {
    SSEServerTransport: vi.fn().mockImplementation(() => {
      return {};
    })
  };
});

// Import after mocks
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMCP, FluentMCP } from './fluent-mcp.js';

describe('FluentMCP', () => {
  let mcp: FluentMCP;

  beforeEach(() => {
    // Clear mock call history but keep implementations
    mockToolFn.mockClear();
    mockConnectFn.mockClear();
    mockSetRequestHandler.mockClear();
    vi.mocked(McpServer).mockClear();

    mcp = createMCP('test-server', '1.0.0');
  });

  describe('constructor', () => {
    it('should create a FluentMCP instance with name and version', () => {
      expect(mcp).toBeInstanceOf(FluentMCP);
      expect(McpServer).toHaveBeenCalledWith({
        name: 'test-server',
        version: '1.0.0'
      });
    });

    it('should create instance with default version', () => {
      const mcp2 = createMCP('test-server');
      expect(McpServer).toHaveBeenCalledWith({
        name: 'test-server',
        version: '1.0.0'
      });
    });

    it('should accept additional options', () => {
      const mcp2 = createMCP('test-server', '2.0.0', { customOption: 'value' });
      expect(McpServer).toHaveBeenCalledWith({
        name: 'test-server',
        version: '2.0.0',
        customOption: 'value'
      });
    });

    it('should initialize z and schema properties', () => {
      expect(mcp.z).toBe(z);
      expect(mcp.schema).toBe(z);
    });

    it('should initialize mcpResources and mcpPrompts as empty Maps', () => {
      expect(mcp.mcpResources).toBeInstanceOf(Map);
      expect(mcp.mcpResources.size).toBe(0);
      expect(mcp.mcpPrompts).toBeInstanceOf(Map);
      expect(mcp.mcpPrompts.size).toBe(0);
    });
  });

  describe('createMCP factory function', () => {
    it('should return a FluentMCP instance', () => {
      const instance = createMCP('test');
      expect(instance).toBeInstanceOf(FluentMCP);
    });

    it('should pass all arguments to constructor', () => {
      const instance = createMCP('my-server', '3.0.0', { debug: true });
      expect(McpServer).toHaveBeenCalledWith({
        name: 'my-server',
        version: '3.0.0',
        debug: true
      });
    });
  });

  describe('resource method', () => {
    it('should initialize a resource store', () => {
      const initialData = { item1: { id: 'item1', name: 'Test Item' } };

      const result = mcp.resource('TestItems', initialData);

      expect(result).toBe(mcp); // Should return instance for chaining
      expect(mcp.getResource('TestItems')).toEqual(initialData);
    });

    it('should initialize an empty resource store when no initial data is provided', () => {
      mcp.resource('EmptyItems');

      expect(mcp.getResource('EmptyItems')).toEqual({});
    });
  });

  describe('getResource method', () => {
    it('should return the resource store', () => {
      const initialData = { item1: { id: 'item1', name: 'Test Item' } };
      mcp.resource('TestItems', initialData);

      const result = mcp.getResource('TestItems');

      expect(result).toEqual(initialData);
    });

    it('should return an empty object for non-existent resources', () => {
      const result = mcp.getResource('NonExistentResource');

      expect(result).toEqual({});
    });
  });

  describe('setResource method', () => {
    it('should set a resource value', () => {
      mcp.resource('TestItems');
      const item = { id: 'item1', name: 'Test Item' };

      const result = mcp.setResource('TestItems', 'item1', item);

      expect(result).toBe(mcp); // Should return instance for chaining
      expect(mcp.getResource('TestItems')).toEqual({ item1: item });
    });

    it('should initialize the resource if it does not exist', () => {
      const item = { id: 'item1', name: 'Test Item' };

      mcp.setResource('NewResource', 'item1', item);

      expect(mcp.getResource('NewResource')).toEqual({ item1: item });
    });
  });

  describe('deleteResource method', () => {
    it('should delete a resource value', () => {
      const initialData = {
        item1: { id: 'item1', name: 'Test Item 1' },
        item2: { id: 'item2', name: 'Test Item 2' }
      };
      mcp.resource('TestItems', initialData);

      const result = mcp.deleteResource('TestItems', 'item1');

      expect(result).toBe(mcp); // Should return instance for chaining
      expect(mcp.getResource('TestItems')).toEqual({
        item2: { id: 'item2', name: 'Test Item 2' }
      });
    });

    it('should do nothing if the resource does not exist', () => {
      const result = mcp.deleteResource('NonExistentResource', 'item1');

      expect(result).toBe(mcp);
      expect(mcp.getResource('NonExistentResource')).toEqual({});
    });

    it('should do nothing if the item does not exist in resource', () => {
      mcp.resource('TestItems', { item1: { id: 'item1' } });

      mcp.deleteResource('TestItems', 'nonexistent');

      expect(mcp.getResource('TestItems')).toEqual({ item1: { id: 'item1' } });
    });
  });

  describe('tool method', () => {
    it('should register a tool with the server', () => {
      const name = 'testTool';
      const schema = { param: z.string() };
      const handler = vi.fn();

      const result = mcp.tool(name, schema, handler);

      expect(result).toBe(mcp); // Should return instance for chaining
      expect(mockToolFn).toHaveBeenCalled();
    });

    it('should register a tool with Zod object schema', () => {
      const schema = z.object({
        name: z.string().describe('User name'),
        age: z.number().describe('User age')
      }).describe('User schema');
      const handler = vi.fn();

      mcp.tool('createUser', schema, handler);

      expect(mockToolFn).toHaveBeenCalled();
    });

    it('should register a tool with plain object schema', () => {
      const schema = {
        query: z.string().describe('Search query'),
        limit: z.number().optional()
      };
      const handler = vi.fn();

      mcp.tool('search', schema, handler);

      expect(mockToolFn).toHaveBeenCalled();
    });

    it('should register a tool with empty schema', () => {
      const handler = vi.fn();

      mcp.tool('noParams', {}, handler);

      expect(mockToolFn).toHaveBeenCalled();
    });
  });

  describe('addResource method', () => {
    it('should register an MCP resource with full options', () => {
      const uri = 'test://resource';
      const options = {
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'application/json'
      };
      const handler = vi.fn().mockResolvedValue({ data: 'test' });

      const result = mcp.addResource(uri, options, handler);

      expect(result).toBe(mcp);
      expect(mcp.mcpResources.get(uri)).toEqual({
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'application/json',
        handler
      });
    });

    it('should register an MCP resource with handler as second parameter', () => {
      const uri = 'test://resource';
      const handler = vi.fn().mockResolvedValue({ data: 'test' });

      mcp.addResource(uri, handler);

      expect(mcp.mcpResources.get(uri)).toEqual({
        name: 'resource',
        description: 'Resource at test://resource',
        mimeType: 'text/plain',
        handler
      });
    });

    it('should use defaults for missing options', () => {
      const uri = 'test://some/deep/path/myfile.txt';
      const handler = vi.fn();

      mcp.addResource(uri, {}, handler);

      const resource = mcp.mcpResources.get(uri);
      expect(resource.name).toBe('myfile.txt');
      expect(resource.description).toBe('Resource at test://some/deep/path/myfile.txt');
      expect(resource.mimeType).toBe('text/plain');
    });

    it('should handle uri with no path segments', () => {
      const uri = 'test://';
      const handler = vi.fn();

      mcp.addResource(uri, {}, handler);

      const resource = mcp.mcpResources.get(uri);
      expect(resource.name).toBe('Resource');
    });
  });

  describe('addPrompt method', () => {
    it('should register an MCP prompt with full options', () => {
      const name = 'test-prompt';
      const options = {
        description: 'A test prompt',
        arguments: [
          { name: 'arg1', description: 'First argument', required: true },
          { name: 'arg2', description: 'Second argument', required: false }
        ]
      };
      const handler = vi.fn().mockResolvedValue('Test prompt result');

      const result = mcp.addPrompt(name, options, handler);

      expect(result).toBe(mcp);
      expect(mcp.mcpPrompts.get(name)).toEqual({
        description: 'A test prompt',
        arguments: options.arguments,
        handler
      });
    });

    it('should register an MCP prompt with handler as second parameter', () => {
      const name = 'test-prompt';
      const handler = vi.fn().mockResolvedValue('Test prompt result');

      mcp.addPrompt(name, handler);

      expect(mcp.mcpPrompts.get(name)).toEqual({
        description: 'Prompt: test-prompt',
        arguments: [],
        handler
      });
    });

    it('should use defaults for missing options', () => {
      const name = 'my-prompt';
      const handler = vi.fn();

      mcp.addPrompt(name, {}, handler);

      const prompt = mcp.mcpPrompts.get(name);
      expect(prompt.description).toBe('Prompt: my-prompt');
      expect(prompt.arguments).toEqual([]);
    });
  });

  describe('crud method', () => {
    it('should create CRUD tools for a resource', () => {
      const schema = {
        name: z.string().describe('Task name'),
        completed: z.boolean().optional()
      };

      const result = mcp.crud('Task', schema);

      expect(result).toBe(mcp); // Should return instance for chaining

      // Should register 5 tools (get, getAll, create, update, delete)
      expect(mockToolFn).toHaveBeenCalledTimes(5);
    });

    it('should use custom singular and plural names', () => {
      const schema = { name: z.string() };

      mcp.crud('person', schema, {
        singularName: 'Person',
        pluralName: 'People'
      });

      expect(mockToolFn).toHaveBeenCalledTimes(5);
    });

    it('should respect generateIds option', () => {
      const schema = { name: z.string() };

      mcp.crud('Item', schema, { generateIds: false });

      expect(mockToolFn).toHaveBeenCalledTimes(5);
    });

    it('should respect timestamps option', () => {
      const schema = { name: z.string() };

      mcp.crud('Item', schema, { timestamps: false });

      expect(mockToolFn).toHaveBeenCalledTimes(5);
    });
  });

  describe('stdio method', () => {
    it('should configure stdio transport', () => {
      const result = mcp.stdio();

      expect(result).toBe(mcp); // Should return instance for chaining
    });
  });

  describe('sse method', () => {
    it('should configure SSE transport', () => {
      const mockRes = { writeHead: vi.fn(), write: vi.fn() };

      const result = mcp.sse('/messages', mockRes as any);

      expect(result).toBe(mcp); // Should return instance for chaining
    });
  });

  describe('start method', () => {
    beforeEach(() => {
      // Store original NODE_ENV
      process.env.NODE_ENV = 'test';
    });

    it('should start with stdio transport by default', async () => {
      await mcp.start();

      expect(mockConnectFn).toHaveBeenCalled();
    });

    it('should start with configured stdio transport', async () => {
      mcp.stdio();
      await mcp.start();

      expect(mockConnectFn).toHaveBeenCalled();
    });

    it('should start with SSE transport', async () => {
      const mockRes = { writeHead: vi.fn(), write: vi.fn() };
      mcp.sse('/messages', mockRes as any);

      await mcp.start();

      expect(mockConnectFn).toHaveBeenCalled();
    });

    it('should return the FluentMCP instance', async () => {
      const result = await mcp.start();

      expect(result).toBe(mcp);
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const handler = vi.fn();

      const result = mcp
        .resource('users')
        .tool('getTool', {}, handler)
        .addResource('file://test', handler)
        .addPrompt('myPrompt', handler)
        .stdio();

      expect(result).toBe(mcp);
      expect(mockToolFn).toHaveBeenCalled();
    });

    it('should chain CRUD after other methods', () => {
      const handler = vi.fn();

      const result = mcp
        .resource('cache')
        .tool('helper', {}, handler)
        .crud('Task', { name: z.string() });

      expect(result).toBe(mcp);
      // 1 tool + 5 crud tools = 6 calls
      expect(mockToolFn).toHaveBeenCalledTimes(6);
    });
  });
});

describe('FluentMCP CRUD Operations', () => {
  let mcp: FluentMCP;
  let mockMcpServer: any;
  let toolHandlers: Record<string, Function>;

  beforeEach(() => {
    vi.resetAllMocks();
    toolHandlers = {};

    // Create a mock that captures tool handlers
    (McpServer as any).mockImplementation(() => {
      mockMcpServer = {
        tool: vi.fn((name: string, schema: any, handler: Function) => {
          toolHandlers[name] = handler;
        }),
        connect: vi.fn().mockResolvedValue(undefined),
        server: {
          setRequestHandler: vi.fn()
        }
      };
      return mockMcpServer;
    });

    mcp = createMCP('test-server');
    mcp.crud('Task', {
      title: z.string().describe('Task title'),
      completed: z.boolean().optional().describe('Task completion status')
    });
  });

  describe('getTask handler', () => {
    it('should return not found for non-existent item', async () => {
      const handler = toolHandlers['getTask'];
      const result = await handler.call(mcp, { id: 'nonexistent' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Task not found');
    });

    it('should return item when found', async () => {
      // First create an item
      mcp.setResource('Tasks', 'task1', { id: 'task1', title: 'Test Task' });

      const handler = toolHandlers['getTask'];
      const result = await handler.call(mcp, { id: 'task1' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.title).toBe('Test Task');
    });
  });

  describe('getAllTasks handler', () => {
    it('should return empty array when no items', async () => {
      const handler = toolHandlers['getAllTasks'];
      const result = await handler.call(mcp, {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual([]);
      expect(parsed.count).toBe(0);
    });

    it('should return all items', async () => {
      mcp.setResource('Tasks', 'task1', { id: 'task1', title: 'Task 1' });
      mcp.setResource('Tasks', 'task2', { id: 'task2', title: 'Task 2' });

      const handler = toolHandlers['getAllTasks'];
      const result = await handler.call(mcp, {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.count).toBe(2);
    });
  });

  describe('createTask handler', () => {
    it('should create a new item with auto-generated ID', async () => {
      const handler = toolHandlers['createTask'];
      const result = await handler.call(mcp, { title: 'New Task' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.title).toBe('New Task');
      expect(parsed.data.id).toBeDefined();
      expect(parsed.data.createdAt).toBeDefined();
    });
  });

  describe('updateTask handler', () => {
    it('should return not found for non-existent item', async () => {
      const handler = toolHandlers['updateTask'];
      const result = await handler.call(mcp, { id: 'nonexistent', title: 'Updated' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Task not found');
    });

    it('should update an existing item', async () => {
      mcp.setResource('Tasks', 'task1', { id: 'task1', title: 'Old Title' });

      const handler = toolHandlers['updateTask'];
      const result = await handler.call(mcp, { id: 'task1', title: 'New Title' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.title).toBe('New Title');
      expect(parsed.data.updatedAt).toBeDefined();
    });
  });

  describe('deleteTask handler', () => {
    it('should return not found for non-existent item', async () => {
      const handler = toolHandlers['deleteTask'];
      const result = await handler.call(mcp, { id: 'nonexistent' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Task not found');
    });

    it('should delete an existing item', async () => {
      mcp.setResource('Tasks', 'task1', { id: 'task1', title: 'To Delete' });

      const handler = toolHandlers['deleteTask'];
      const result = await handler.call(mcp, { id: 'task1' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Task deleted successfully');
      expect(mcp.getResource('Tasks')['task1']).toBeUndefined();
    });
  });
});

describe('FluentMCP CRUD without auto ID generation', () => {
  let mcp: FluentMCP;
  let toolHandlers: Record<string, Function>;

  beforeEach(() => {
    vi.resetAllMocks();
    toolHandlers = {};

    (McpServer as any).mockImplementation(() => {
      return {
        tool: vi.fn((name: string, schema: any, handler: Function) => {
          toolHandlers[name] = handler;
        }),
        connect: vi.fn().mockResolvedValue(undefined),
        server: {
          setRequestHandler: vi.fn()
        }
      };
    });

    mcp = createMCP('test-server');
    mcp.crud('Item', {
      name: z.string()
    }, { generateIds: false });
  });

  describe('createItem without auto ID', () => {
    it('should require ID when auto generation is disabled', async () => {
      const handler = toolHandlers['createItem'];
      const result = await handler.call(mcp, { name: 'Test' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('ID is required when auto-generation is disabled');
    });

    it('should create item with provided ID', async () => {
      const handler = toolHandlers['createItem'];
      const result = await handler.call(mcp, { id: 'custom-id', name: 'Test' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.id).toBe('custom-id');
    });
  });
});

describe('FluentMCP CRUD without timestamps', () => {
  let mcp: FluentMCP;
  let toolHandlers: Record<string, Function>;

  beforeEach(() => {
    vi.resetAllMocks();
    toolHandlers = {};

    (McpServer as any).mockImplementation(() => {
      return {
        tool: vi.fn((name: string, schema: any, handler: Function) => {
          toolHandlers[name] = handler;
        }),
        connect: vi.fn().mockResolvedValue(undefined),
        server: {
          setRequestHandler: vi.fn()
        }
      };
    });

    mcp = createMCP('test-server');
    mcp.crud('Item', {
      name: z.string()
    }, { timestamps: false });
  });

  describe('createItem without timestamps', () => {
    it('should not add createdAt timestamp', async () => {
      const handler = toolHandlers['createItem'];
      const result = await handler.call(mcp, { name: 'Test' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.createdAt).toBeUndefined();
    });
  });

  describe('updateItem without timestamps', () => {
    it('should not add updatedAt timestamp', async () => {
      mcp.setResource('Items', 'item1', { id: 'item1', name: 'Old' });

      const handler = toolHandlers['updateItem'];
      const result = await handler.call(mcp, { id: 'item1', name: 'New' });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.updatedAt).toBeUndefined();
    });
  });
});
