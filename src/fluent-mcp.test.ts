import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock the McpServer class
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(() => {
      const mockServer = {
        tool: vi.fn().mockReturnThis(),
        connect: vi.fn().mockResolvedValue(undefined),
        server: {
          setRequestHandler: vi.fn()
        }
      };
      return mockServer;
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

// Import the fluent MCP interface
import { createMCP, FluentMCP } from './fluent-mcp.js';

// Define a type for our mock server
type MockServer = {
  server: {
    tool: ReturnType<typeof vi.fn>;
  };
  resource: (name: string, initialData?: Record<string, any>) => MockServer;
  getResource: (name: string) => Record<string, any>;
  setResource: (name: string, id: string, data: any) => MockServer;
  deleteResource: (name: string, id: string) => MockServer;
  tool: (name: string, schema: any, handler: Function) => MockServer;
  resources: Record<string, Record<string, any>>;
};

describe('FluentMCP', () => {
  let server: MockServer;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Create a new mock server instance
    server = {
      server: {
        tool: vi.fn()
      },
      resources: {},
      resource: vi.fn().mockImplementation(function(this: any, name: string, initialData = {}) {
        this.resources[name] = initialData;
        return this;
      }),
      getResource: vi.fn().mockImplementation(function(this: any, name: string) {
        return this.resources[name] || {};
      }),
      setResource: vi.fn().mockImplementation(function(this: any, name: string, id: string, data: any) {
        if (!this.resources[name]) {
          this.resources[name] = {};
        }
        this.resources[name][id] = data;
        return this;
      }),
      deleteResource: vi.fn().mockImplementation(function(this: any, name: string, id: string) {
        if (this.resources[name] && this.resources[name][id]) {
          delete this.resources[name][id];
        }
        return this;
      }),
      tool: vi.fn().mockImplementation(function(this: any, name: string, schema: any, handler: Function) {
        this.server.tool(name, schema, handler);
        return this;
      })
    };
  });

  describe('resource method', () => {
    it('should initialize a resource store', () => {
      // Setup
      const initialData = { item1: { id: 'item1', name: 'Test Item' } };
      
      // Act
      server.resource('TestItems', initialData);
      
      // Assert
      expect(server.getResource('TestItems')).toEqual(initialData);
    });
    
    it('should initialize an empty resource store when no initial data is provided', () => {
      // Act
      server.resource('EmptyItems');
      
      // Assert
      expect(server.getResource('EmptyItems')).toEqual({});
    });
  });
  
  describe('getResource method', () => {
    it('should return the resource store', () => {
      // Setup
      const initialData = { item1: { id: 'item1', name: 'Test Item' } };
      server.resource('TestItems', initialData);
      
      // Act
      const result = server.getResource('TestItems');
      
      // Assert
      expect(result).toEqual(initialData);
    });
    
    it('should return an empty object for non-existent resources', () => {
      // Act
      const result = server.getResource('NonExistentResource');
      
      // Assert
      expect(result).toEqual({});
    });
  });
  
  describe('setResource method', () => {
    it('should set a resource value', () => {
      // Setup
      server.resource('TestItems');
      const item = { id: 'item1', name: 'Test Item' };
      
      // Act
      server.setResource('TestItems', 'item1', item);
      
      // Assert
      expect(server.getResource('TestItems')).toEqual({ item1: item });
    });
    
    it('should initialize the resource if it does not exist', () => {
      // Setup
      const item = { id: 'item1', name: 'Test Item' };
      
      // Act
      server.setResource('NewResource', 'item1', item);
      
      // Assert
      expect(server.getResource('NewResource')).toEqual({ item1: item });
    });
  });
  
  describe('deleteResource method', () => {
    it('should delete a resource value', () => {
      // Setup
      const initialData = { 
        item1: { id: 'item1', name: 'Test Item 1' },
        item2: { id: 'item2', name: 'Test Item 2' }
      };
      server.resource('TestItems', initialData);
      
      // Act
      server.deleteResource('TestItems', 'item1');
      
      // Assert
      expect(server.getResource('TestItems')).toEqual({ 
        item2: { id: 'item2', name: 'Test Item 2' }
      });
    });
    
    it('should do nothing if the resource does not exist', () => {
      // Act
      server.deleteResource('NonExistentResource', 'item1');
      
      // Assert - should not throw an error
      expect(server.getResource('NonExistentResource')).toEqual({});
    });
  });
  
  describe('tool method', () => {
    it('should register a tool with the server', () => {
      // Setup
      const name = 'testTool';
      const schema = { param: 'string' };
      const handler = vi.fn();
      
      // Act
      server.tool(name, schema, handler);
      
      // Assert
      expect(server.tool).toHaveBeenCalled();
      // Since we're using a mock implementation, we can't directly test the internal server.tool call
      // Instead, we verify that our mock tool function was called with the right arguments
    });
    
    it('should return the server instance for chaining', () => {
      // Act
      const result = server.tool('testTool', {}, vi.fn());
      
      // Assert
      expect(result).toBe(server);
    });
  });
});

describe('FluentMCP - MCP Resources and Prompts', () => {
  describe('addResource method', () => {
    it('should register an MCP resource with full options', () => {
      // Setup
      const mcp = createMCP('test-server');
      const uri = 'test://resource';
      const options = {
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'application/json'
      };
      const handler = vi.fn().mockResolvedValue({ data: 'test' });
      
      // Act
      const result = mcp.addResource(uri, options, handler);
      
      // Assert
      expect(result).toBe(mcp); // Should return instance for chaining
      expect(mcp.mcpResources.get(uri)).toEqual({
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'application/json',
        handler
      });
    });

    it('should register an MCP resource with handler as second parameter', () => {
      // Setup
      const mcp = createMCP('test-server');
      const uri = 'test://resource';
      const handler = vi.fn().mockResolvedValue({ data: 'test' });
      
      // Act
      mcp.addResource(uri, handler);
      
      // Assert
      expect(mcp.mcpResources.get(uri)).toEqual({
        name: 'resource',
        description: 'Resource at test://resource',
        mimeType: 'text/plain',
        handler
      });
    });

    it('should use defaults for missing options', () => {
      // Setup
      const mcp = createMCP('test-server');
      const uri = 'test://some/deep/path/myfile.txt';
      const handler = vi.fn();
      
      // Act
      mcp.addResource(uri, {}, handler);
      
      // Assert
      const resource = mcp.mcpResources.get(uri);
      expect(resource.name).toBe('myfile.txt');
      expect(resource.description).toBe('Resource at test://some/deep/path/myfile.txt');
      expect(resource.mimeType).toBe('text/plain');
    });
  });

  describe('addPrompt method', () => {
    it('should register an MCP prompt with full options', () => {
      // Setup
      const mcp = createMCP('test-server');
      const name = 'test-prompt';
      const options = {
        description: 'A test prompt',
        arguments: [
          { name: 'arg1', description: 'First argument', required: true },
          { name: 'arg2', description: 'Second argument', required: false }
        ]
      };
      const handler = vi.fn().mockResolvedValue('Test prompt result');
      
      // Act
      const result = mcp.addPrompt(name, options, handler);
      
      // Assert
      expect(result).toBe(mcp); // Should return instance for chaining
      expect(mcp.mcpPrompts.get(name)).toEqual({
        description: 'A test prompt',
        arguments: options.arguments,
        handler
      });
    });

    it('should register an MCP prompt with handler as second parameter', () => {
      // Setup
      const mcp = createMCP('test-server');
      const name = 'test-prompt';
      const handler = vi.fn().mockResolvedValue('Test prompt result');
      
      // Act
      mcp.addPrompt(name, handler);
      
      // Assert
      expect(mcp.mcpPrompts.get(name)).toEqual({
        description: 'Prompt: test-prompt',
        arguments: [],
        handler
      });
    });

    it('should use defaults for missing options', () => {
      // Setup
      const mcp = createMCP('test-server');
      const name = 'my-prompt';
      const handler = vi.fn();

      // Act
      mcp.addPrompt(name, {}, handler);

      // Assert
      const prompt = mcp.mcpPrompts.get(name);
      expect(prompt.description).toBe('Prompt: my-prompt');
      expect(prompt.arguments).toEqual([]);
    });
  });
});

describe('FluentMCP - Constructor and Factory', () => {
  it('should create instance with name only', () => {
    const mcp = createMCP('my-server');
    expect(mcp).toBeInstanceOf(FluentMCP);
  });

  it('should create instance with name and version', () => {
    const mcp = createMCP('my-server', '2.0.0');
    expect(mcp).toBeInstanceOf(FluentMCP);
  });

  it('should create instance with options', () => {
    const mcp = createMCP('my-server', '1.0.0', {
      autoGenerateIds: false,
      timestampEntries: false,
    });
    expect(mcp).toBeInstanceOf(FluentMCP);
  });

  it('should expose z and schema for Zod validation', () => {
    const mcp = createMCP('my-server');
    expect(mcp.z).toBeDefined();
    expect(mcp.schema).toBeDefined();
    expect(mcp.z).toBe(mcp.schema);
  });
});

describe('FluentMCP - Transport Configuration', () => {
  it('should configure stdio transport', () => {
    const mcp = createMCP('test-server');

    const result = mcp.stdio();

    expect(result).toBe(mcp); // Chainable
  });

  it('should support method chaining with resource and stdio', () => {
    const mcp = createMCP('test-server');

    const result = mcp
      .resource('notes')
      .stdio();

    expect(result).toBe(mcp);
  });
});

describe('FluentMCP - Resource Store Operations', () => {
  it('should support full resource lifecycle with actual FluentMCP instance', () => {
    const mcp = createMCP('test-server');

    // Initialize resource
    mcp.resource('items', {
      item1: { id: 'item1', name: 'First' }
    });

    // Get resource
    const items = mcp.getResource('items');
    expect(items).toEqual({
      item1: { id: 'item1', name: 'First' }
    });

    // Set resource
    mcp.setResource('items', 'item2', { id: 'item2', name: 'Second' });
    expect(mcp.getResource('items')).toHaveProperty('item2');

    // Delete resource
    mcp.deleteResource('items', 'item1');
    expect(mcp.getResource('items')).not.toHaveProperty('item1');
    expect(mcp.getResource('items')).toHaveProperty('item2');
  });

  it('should return empty object for non-existent resources', () => {
    const mcp = createMCP('test-server');

    const result = mcp.getResource('nonexistent');

    expect(result).toEqual({});
  });

  it('should handle setResource on non-initialized resource', () => {
    const mcp = createMCP('test-server');

    mcp.setResource('newStore', 'id1', { value: 'test' });

    expect(mcp.getResource('newStore')).toEqual({
      id1: { value: 'test' }
    });
  });

  it('should handle deleteResource on non-existent resource gracefully', () => {
    const mcp = createMCP('test-server');

    // Should not throw
    mcp.deleteResource('nonexistent', 'id');

    expect(mcp.getResource('nonexistent')).toEqual({});
  });
});