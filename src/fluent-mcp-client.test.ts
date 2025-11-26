import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock the Client class from MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: vi.fn().mockImplementation(() => {
      return {
        connect: vi.fn().mockResolvedValue(undefined),
        request: vi.fn(),
        callTool: vi.fn(),
        onerror: null,
        setNotificationHandler: vi.fn()
      };
    })
  };
});

// Mock the StdioClientTransport class
vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
  return {
    StdioClientTransport: vi.fn().mockImplementation(() => {
      return {
        start: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
    })
  };
});

// Mock the StreamableHTTPClientTransport class
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => {
  return {
    StreamableHTTPClientTransport: vi.fn().mockImplementation(() => {
      return {
        close: vi.fn().mockResolvedValue(undefined),
      };
    })
  };
});

// Import after mocks to ensure mocks are applied
import { 
  FluentMCPClient, 
  createMCPClient,
  connectMCPClient
} from './fluent-mcp-client.js';

describe('FluentMCPClient', () => {
  let client: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create a new client for each test
    client = createMCPClient('TestClient', '1.0.0');
  });
  
  describe('constructor', () => {
    it('should create a Client instance with the provided name and version', () => {
      expect(Client).toHaveBeenCalledWith({
        name: 'TestClient',
        version: '1.0.0'
      });
    });
    
    it('should initialize z and schema properties', () => {
      expect(client.z).toBeDefined();
      expect(client.schema).toBeDefined();
    });
  });
  
  describe('onError', () => {
    it('should set the error handler on the client', () => {
      const handler = vi.fn();
      const result = client.onError(handler);
      
      expect(client.client.onerror).toBe(handler);
      expect(result).toBe(client); // Should return this for chaining
    });
  });
  
  describe('onNotification', () => {
    it('should register a notification handler', () => {
      const handler = vi.fn();
      const result = client.onNotification(LoggingMessageNotificationSchema, handler);
      
      // Check handler is stored in notificationHandlers
      expect(client.notificationHandlers).toHaveProperty('notification');
      expect(client.notificationHandlers.notification).toBe(handler);
      expect(result).toBe(client); // Should return this for chaining
    });
  });
  
  describe('stdio', () => {
    it('should configure stdio transport', () => {
      const result = client.stdio('test-command', ['arg1', 'arg2'], { option1: 'value1' });
      
      expect(client.transportType).toBe('stdio');
      expect(client.transportOptions).toEqual({
        command: 'test-command',
        args: ['arg1', 'arg2'],
        option1: 'value1'
      });
      expect(result).toBe(client); // Should return this for chaining
    });
  });
  
  describe('http', () => {
    it('should configure http transport', () => {
      const result = client.http('http://example.com/mcp', { option1: 'value1' });
      
      expect(client.transportType).toBe('http');
      expect(client.transportOptions).toEqual({
        url: 'http://example.com/mcp',
        option1: 'value1'
      });
      expect(result).toBe(client); // Should return this for chaining
    });
  });
  
  describe('parseToolResult', () => {
    it('should parse JSON text content from a tool result', () => {
      const toolResult = {
        content: [
          {
            type: 'text',
            text: '{"success":true,"data":{"id":"123","name":"Test"}}'
          }
        ]
      };
      
      const parsed = client.parseToolResult(toolResult);
      expect(parsed).toEqual({
        success: true,
        data: {
          id: '123',
          name: 'Test'
        }
      });
    });
    
    it('should return the text as-is if not valid JSON', () => {
      const toolResult = {
        content: [
          {
            type: 'text',
            text: 'Not JSON'
          }
        ]
      };
      
      const parsed = client.parseToolResult(toolResult);
      expect(parsed).toBe('Not JSON');
    });
    
    it('should return null for invalid input', () => {
      expect(client.parseToolResult(null)).toBeNull();
      expect(client.parseToolResult({})).toBeNull();
      expect(client.parseToolResult({ content: [] })).toBeNull();
    });
  });
  
  describe('listRoots', () => {
    it('should make a request to roots/list and return roots', async () => {
      const mockRoots = [
        { uri: 'file:///home/user', name: 'Home Directory' },
        { uri: 'file:///workspace', name: 'Workspace' }
      ];
      
      // Mock the request method specifically for this test
      const mockRequest = vi.fn().mockResolvedValue({ roots: mockRoots });
      (client as any).client.request = mockRequest;
      
      const result = await client.listRoots();
      
      expect(mockRequest).toHaveBeenCalledWith(
        { method: 'roots/list', params: {} },
        expect.any(Object) // ListRootsResultSchema
      );
      expect(result).toEqual(mockRoots);
    });
    
    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;
      
      await expect(clientWithoutConnection.listRoots()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });
    
    it('should handle and rethrow errors from the request', async () => {
      const error = new Error('Network error');
      const mockRequest = vi.fn().mockRejectedValue(error);
      (client as any).client.request = mockRequest;
      
      await expect(client.listRoots()).rejects.toThrow('Network error');
    });
  });

  // Factory function tests
  describe('factory functions', () => {
    it('createMCPClient should return a FluentMCPClient instance', () => {
      const client = createMCPClient('TestClient', '1.0.0');
      expect(client).toBeInstanceOf(FluentMCPClient);
    });

    it('createMCPClient should accept options', () => {
      const client = createMCPClient('TestClient', '1.0.0', { customOption: true });
      expect(client).toBeInstanceOf(FluentMCPClient);
    });
  });

  describe('sse transport', () => {
    it('should configure sse transport', () => {
      const result = client.sse('http://example.com/sse', { option1: 'value1' });

      expect(client.transportType).toBe('sse');
      expect(client.transportOptions).toEqual({
        url: 'http://example.com/sse',
        option1: 'value1'
      });
      expect(result).toBe(client); // Should return this for chaining
    });
  });

  describe('callTool', () => {
    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.callTool('testTool', {})).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should call tool with arguments', async () => {
      const mockResult = { content: [{ type: 'text', text: '{"success": true}' }] };
      const mockCallTool = vi.fn().mockResolvedValue(mockResult);
      (client as any).client.callTool = mockCallTool;

      const result = await client.callTool('myTool', { arg1: 'value1' });

      expect(mockCallTool).toHaveBeenCalledWith(
        { name: 'myTool', arguments: { arg1: 'value1' } },
        expect.anything()
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('listTools', () => {
    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.listTools()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should list available tools', async () => {
      const mockTools = [{ name: 'tool1' }, { name: 'tool2' }];
      const mockRequest = vi.fn().mockResolvedValue({ tools: mockTools });
      (client as any).client.request = mockRequest;

      const result = await client.listTools();

      expect(mockRequest).toHaveBeenCalledWith(
        { method: 'tools/list', params: {} },
        expect.anything()
      );
      expect(result).toEqual(mockTools);
    });
  });

  describe('listResources', () => {
    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.listResources()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should list available resources', async () => {
      const mockResources = [{ uri: 'test://resource1' }, { uri: 'test://resource2' }];
      const mockRequest = vi.fn().mockResolvedValue({ resources: mockResources });
      (client as any).client.request = mockRequest;

      const result = await client.listResources();

      expect(mockRequest).toHaveBeenCalledWith(
        { method: 'resources/list', params: {} },
        expect.anything()
      );
      expect(result).toEqual(mockResources);
    });
  });

  describe('listPrompts', () => {
    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.listPrompts()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should list available prompts', async () => {
      const mockPrompts = [{ name: 'prompt1' }, { name: 'prompt2' }];
      const mockRequest = vi.fn().mockResolvedValue({ prompts: mockPrompts });
      (client as any).client.request = mockRequest;

      const result = await client.listPrompts();

      expect(mockRequest).toHaveBeenCalledWith(
        { method: 'prompts/list', params: {} },
        expect.anything()
      );
      expect(result).toEqual(mockPrompts);
    });
  });

  describe('getPrompt', () => {
    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.getPrompt('test-prompt')).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should get a prompt by name', async () => {
      const mockPromptResult = { messages: [{ content: 'Hello' }] };
      const mockRequest = vi.fn().mockResolvedValue(mockPromptResult);
      (client as any).client.request = mockRequest;

      const result = await client.getPrompt('my-prompt', { arg1: 'value1' });

      expect(mockRequest).toHaveBeenCalledWith(
        { method: 'prompts/get', params: { name: 'my-prompt', arguments: { arg1: 'value1' } } },
        expect.anything()
      );
      expect(result).toEqual(mockPromptResult);
    });
  });

  describe('parseToolResult edge cases', () => {
    it('should handle content array with multiple items', () => {
      const toolResult = {
        content: [
          { type: 'image', data: 'base64data' },
          { type: 'text', text: '{"key": "value"}' }
        ]
      };

      const parsed = client.parseToolResult(toolResult);
      expect(parsed).toEqual({ key: 'value' });
    });

    it('should return first text content found', () => {
      const toolResult = {
        content: [
          { type: 'text', text: 'first' },
          { type: 'text', text: 'second' }
        ]
      };

      const parsed = client.parseToolResult(toolResult);
      expect(parsed).toBe('first');
    });
  });

  describe('chaining', () => {
    it('should support full chaining configuration', () => {
      const errorHandler = vi.fn();
      const notificationHandler = vi.fn();

      const result = client
        .onError(errorHandler)
        .onNotification(LoggingMessageNotificationSchema, notificationHandler)
        .stdio('node', ['server.js'], { env: {} });

      expect(result).toBe(client);
      expect(client.client.onerror).toBe(errorHandler);
      expect(client.transportType).toBe('stdio');
    });
  });
});