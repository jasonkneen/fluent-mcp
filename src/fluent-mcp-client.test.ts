import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Create mock functions at module level for consistent behavior
const mockClientConnect = vi.fn().mockResolvedValue(undefined);
const mockClientRequest = vi.fn();
const mockClientCallTool = vi.fn();
const mockSetNotificationHandler = vi.fn();

// Mock the Client class from MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: vi.fn().mockImplementation(() => {
      return {
        connect: mockClientConnect,
        request: mockClientRequest,
        callTool: mockClientCallTool,
        onerror: null,
        setNotificationHandler: mockSetNotificationHandler
      };
    })
  };
});

// Mock transport close function
const mockTransportClose = vi.fn().mockResolvedValue(undefined);

// Mock the StdioClientTransport class
vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => {
  return {
    StdioClientTransport: vi.fn().mockImplementation(() => {
      return {
        start: vi.fn().mockResolvedValue(undefined),
        close: mockTransportClose,
      };
    })
  };
});

// Mock the StreamableHTTPClientTransport class
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => {
  return {
    StreamableHTTPClientTransport: vi.fn().mockImplementation(() => {
      return {
        close: mockTransportClose,
      };
    })
  };
});

// Mock the SSEClientTransport class
vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => {
  return {
    SSEClientTransport: vi.fn().mockImplementation(() => {
      return {
        close: mockTransportClose,
      };
    })
  };
});

// Import after mocks to ensure mocks are applied
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
  FluentMCPClient,
  createMCPClient,
  connectMCPClient
} from './fluent-mcp-client.js';

describe('FluentMCPClient', () => {
  let client: any;

  beforeEach(() => {
    // Clear mock call history but keep implementations
    mockClientConnect.mockClear();
    mockClientRequest.mockClear();
    mockClientCallTool.mockClear();
    mockSetNotificationHandler.mockClear();
    mockTransportClose.mockClear();
    vi.mocked(Client).mockClear();
    vi.mocked(StdioClientTransport).mockClear();
    vi.mocked(StreamableHTTPClientTransport).mockClear();
    vi.mocked(SSEClientTransport).mockClear();

    client = createMCPClient('TestClient', '1.0.0');
  });

  describe('constructor', () => {
    it('should create a Client instance with the provided name and version', () => {
      expect(Client).toHaveBeenCalledWith({
        name: 'TestClient',
        version: '1.0.0'
      });
    });

    it('should use default version 1.0.0 when not provided', () => {
      createMCPClient('TestClient');
      expect(Client).toHaveBeenCalledWith({
        name: 'TestClient',
        version: '1.0.0'
      });
    });

    it('should pass additional options to Client', () => {
      createMCPClient('TestClient', '2.0.0', { debug: true });
      expect(Client).toHaveBeenCalledWith({
        name: 'TestClient',
        version: '2.0.0',
        debug: true
      });
    });

    it('should initialize z and schema properties', () => {
      expect(client.z).toBe(z);
      expect(client.schema).toBe(z);
    });

    it('should initialize notificationHandlers as empty object', () => {
      expect(client.notificationHandlers).toEqual({});
    });

    it('should set default error handler', () => {
      expect(client.client.onerror).toBeDefined();
    });
  });

  describe('onError', () => {
    it('should set the error handler on the client', () => {
      const handler = vi.fn();
      const result = client.onError(handler);

      expect(client.client.onerror).toBe(handler);
      expect(result).toBe(client);
    });
  });

  describe('onNotification', () => {
    it('should register a notification handler', () => {
      const handler = vi.fn();
      const result = client.onNotification(LoggingMessageNotificationSchema, handler);

      expect(client.notificationHandlers).toHaveProperty('notification');
      expect(client.notificationHandlers.notification).toBe(handler);
      expect(result).toBe(client);
    });

    it('should call setNotificationHandler if available', () => {
      const handler = vi.fn();
      client.onNotification(LoggingMessageNotificationSchema, handler);

      expect(client.client.setNotificationHandler).toHaveBeenCalledWith(
        LoggingMessageNotificationSchema,
        handler
      );
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
      expect(result).toBe(client);
    });

    it('should use default empty args array', () => {
      client.stdio('test-command');

      expect(client.transportOptions.args).toEqual([]);
    });

    it('should use default empty options object', () => {
      client.stdio('test-command', ['arg1']);

      expect(client.transportOptions).toEqual({
        command: 'test-command',
        args: ['arg1']
      });
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
      expect(result).toBe(client);
    });

    it('should use default empty options object', () => {
      client.http('http://example.com/mcp');

      expect(client.transportOptions).toEqual({
        url: 'http://example.com/mcp'
      });
    });
  });

  describe('sse', () => {
    it('should configure sse transport', () => {
      const result = client.sse('http://example.com/sse', { option1: 'value1' });

      expect(client.transportType).toBe('sse');
      expect(client.transportOptions).toEqual({
        url: 'http://example.com/sse',
        option1: 'value1'
      });
      expect(result).toBe(client);
    });

    it('should use default empty options object', () => {
      client.sse('http://example.com/sse');

      expect(client.transportOptions).toEqual({
        url: 'http://example.com/sse'
      });
    });
  });

  describe('callTool', () => {
    it('should call the tool and return result', async () => {
      const mockResult = { content: [{ type: 'text', text: 'result' }] };
      client.client.callTool = vi.fn().mockResolvedValue(mockResult);

      const result = await client.callTool('myTool', { arg1: 'value1' });

      expect(client.client.callTool).toHaveBeenCalledWith(
        { name: 'myTool', arguments: { arg1: 'value1' } },
        expect.any(Object)
      );
      expect(result).toEqual(mockResult);
    });

    it('should use default empty args object', async () => {
      client.client.callTool = vi.fn().mockResolvedValue({});

      await client.callTool('myTool');

      expect(client.client.callTool).toHaveBeenCalledWith(
        { name: 'myTool', arguments: {} },
        expect.any(Object)
      );
    });

    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.callTool('myTool')).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should rethrow errors from callTool', async () => {
      const error = new Error('Tool execution failed');
      client.client.callTool = vi.fn().mockRejectedValue(error);

      await expect(client.callTool('myTool')).rejects.toThrow('Tool execution failed');
    });
  });

  describe('listTools', () => {
    it('should return tools from the server', async () => {
      const mockTools = [
        { name: 'tool1', description: 'First tool' },
        { name: 'tool2', description: 'Second tool' }
      ];
      client.client.request = vi.fn().mockResolvedValue({ tools: mockTools });

      const result = await client.listTools();

      expect(client.client.request).toHaveBeenCalledWith(
        { method: 'tools/list', params: {} },
        expect.any(Object)
      );
      expect(result).toEqual(mockTools);
    });

    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.listTools()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should rethrow errors from request', async () => {
      const error = new Error('Network error');
      client.client.request = vi.fn().mockRejectedValue(error);

      await expect(client.listTools()).rejects.toThrow('Network error');
    });
  });

  describe('listResources', () => {
    it('should return resources from the server', async () => {
      const mockResources = [
        { uri: 'file://test.txt', name: 'Test File' },
        { uri: 'file://data.json', name: 'Data File' }
      ];
      client.client.request = vi.fn().mockResolvedValue({ resources: mockResources });

      const result = await client.listResources();

      expect(client.client.request).toHaveBeenCalledWith(
        { method: 'resources/list', params: {} },
        expect.any(Object)
      );
      expect(result).toEqual(mockResources);
    });

    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.listResources()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should rethrow errors from request', async () => {
      const error = new Error('Network error');
      client.client.request = vi.fn().mockRejectedValue(error);

      await expect(client.listResources()).rejects.toThrow('Network error');
    });
  });

  describe('listPrompts', () => {
    it('should return prompts from the server', async () => {
      const mockPrompts = [
        { name: 'prompt1', description: 'First prompt' },
        { name: 'prompt2', description: 'Second prompt' }
      ];
      client.client.request = vi.fn().mockResolvedValue({ prompts: mockPrompts });

      const result = await client.listPrompts();

      expect(client.client.request).toHaveBeenCalledWith(
        { method: 'prompts/list', params: {} },
        expect.any(Object)
      );
      expect(result).toEqual(mockPrompts);
    });

    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.listPrompts()).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should rethrow errors from request', async () => {
      const error = new Error('Network error');
      client.client.request = vi.fn().mockRejectedValue(error);

      await expect(client.listPrompts()).rejects.toThrow('Network error');
    });
  });

  describe('getPrompt', () => {
    it('should get a prompt with arguments', async () => {
      const mockPromptResult = {
        messages: [{ role: 'user', content: { type: 'text', text: 'Hello' } }]
      };
      client.client.request = vi.fn().mockResolvedValue(mockPromptResult);

      const result = await client.getPrompt('myPrompt', { arg1: 'value1' });

      expect(client.client.request).toHaveBeenCalledWith(
        { method: 'prompts/get', params: { name: 'myPrompt', arguments: { arg1: 'value1' } } },
        expect.any(Object)
      );
      expect(result).toEqual(mockPromptResult);
    });

    it('should use default empty args object', async () => {
      client.client.request = vi.fn().mockResolvedValue({});

      await client.getPrompt('myPrompt');

      expect(client.client.request).toHaveBeenCalledWith(
        { method: 'prompts/get', params: { name: 'myPrompt', arguments: {} } },
        expect.any(Object)
      );
    });

    it('should throw error when client not connected', async () => {
      const clientWithoutConnection = createMCPClient('Test', '1.0.0');
      (clientWithoutConnection as any).client = null;

      await expect(clientWithoutConnection.getPrompt('myPrompt')).rejects.toThrow(
        'Client not connected. Call connect() first.'
      );
    });

    it('should rethrow errors from request', async () => {
      const error = new Error('Prompt not found');
      client.client.request = vi.fn().mockRejectedValue(error);

      await expect(client.getPrompt('myPrompt')).rejects.toThrow('Prompt not found');
    });
  });

  describe('listRoots', () => {
    it('should make a request to roots/list and return roots', async () => {
      const mockRoots = [
        { uri: 'file:///home/user', name: 'Home Directory' },
        { uri: 'file:///workspace', name: 'Workspace' }
      ];
      client.client.request = vi.fn().mockResolvedValue({ roots: mockRoots });

      const result = await client.listRoots();

      expect(client.client.request).toHaveBeenCalledWith(
        { method: 'roots/list', params: {} },
        expect.any(Object)
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
      client.client.request = vi.fn().mockRejectedValue(error);

      await expect(client.listRoots()).rejects.toThrow('Network error');
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

    it('should return null for null input', () => {
      expect(client.parseToolResult(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(client.parseToolResult(undefined)).toBeNull();
    });

    it('should return null for empty object', () => {
      expect(client.parseToolResult({})).toBeNull();
    });

    it('should return null for empty content array', () => {
      expect(client.parseToolResult({ content: [] })).toBeNull();
    });

    it('should return null for content without text type', () => {
      const toolResult = {
        content: [
          { type: 'image', data: 'base64data' }
        ]
      };
      expect(client.parseToolResult(toolResult)).toBeNull();
    });

    it('should find text content among multiple content items', () => {
      const toolResult = {
        content: [
          { type: 'image', data: 'base64data' },
          { type: 'text', text: '{"found":true}' }
        ]
      };
      expect(client.parseToolResult(toolResult)).toEqual({ found: true });
    });
  });

  describe('connect', () => {
    it('should connect with stdio transport', async () => {
      client.stdio('test-command', ['arg1']);

      const result = await client.connect();

      expect(StdioClientTransport).toHaveBeenCalledWith({
        command: 'test-command',
        args: ['arg1']
      });
      expect(client.client.connect).toHaveBeenCalled();
      expect(result).toBe(client);
    });

    it('should connect with http transport', async () => {
      client.http('http://example.com/mcp');

      const result = await client.connect();

      expect(StreamableHTTPClientTransport).toHaveBeenCalled();
      expect(client.client.connect).toHaveBeenCalled();
      expect(result).toBe(client);
    });

    it('should connect with sse transport', async () => {
      client.sse('http://example.com/sse');

      const result = await client.connect();

      expect(SSEClientTransport).toHaveBeenCalled();
      expect(client.client.connect).toHaveBeenCalled();
      expect(result).toBe(client);
    });

    it('should throw error when no transport configured', async () => {
      await expect(client.connect()).rejects.toThrow(
        'No transport configured. Use stdio(), http(), or sse() to configure a transport.'
      );
    });

    it('should store the transport after connection', async () => {
      client.stdio('test-command');

      await client.connect();

      expect(client.transport).toBeDefined();
    });

    it('should rethrow connection errors', async () => {
      client.stdio('test-command');
      const error = new Error('Connection failed');
      client.client.connect = vi.fn().mockRejectedValue(error);

      await expect(client.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should close the transport', async () => {
      client.stdio('test-command');
      await client.connect();

      const result = await client.disconnect();

      expect(client.transport).toBeNull();
      expect(result).toBe(client);
    });

    it('should return client if no transport exists', async () => {
      const result = await client.disconnect();

      expect(result).toBe(client);
    });

    it('should rethrow disconnection errors', async () => {
      client.stdio('test-command');
      await client.connect();

      const error = new Error('Disconnect failed');
      client.transport.close = vi.fn().mockRejectedValue(error);

      await expect(client.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('chaining', () => {
    it('should support method chaining for configuration', () => {
      const errorHandler = vi.fn();
      const notificationHandler = vi.fn();

      const result = client
        .onError(errorHandler)
        .onNotification(LoggingMessageNotificationSchema, notificationHandler)
        .stdio('test-command', ['arg1']);

      expect(result).toBe(client);
    });
  });
});

describe('factory functions', () => {
  beforeEach(() => {
    // Clear mock call history but keep implementations
    mockClientConnect.mockClear();
    mockClientRequest.mockClear();
    mockClientCallTool.mockClear();
    mockSetNotificationHandler.mockClear();
    mockTransportClose.mockClear();
    vi.mocked(Client).mockClear();
    vi.mocked(StdioClientTransport).mockClear();
    vi.mocked(StreamableHTTPClientTransport).mockClear();
    vi.mocked(SSEClientTransport).mockClear();
  });

  describe('createMCPClient', () => {
    it('should return a FluentMCPClient instance', () => {
      const client = createMCPClient('TestClient', '1.0.0');
      expect(client).toBeInstanceOf(FluentMCPClient);
    });

    it('should pass all arguments to constructor', () => {
      createMCPClient('TestClient', '2.0.0', { debug: true });
      expect(Client).toHaveBeenCalledWith({
        name: 'TestClient',
        version: '2.0.0',
        debug: true
      });
    });
  });

  describe('connectMCPClient', () => {
    it('should create and connect a client with stdio transport', async () => {
      const client = await connectMCPClient('TestClient', '1.0.0', {
        type: 'stdio',
        command: 'test-command',
        args: ['arg1']
      });

      expect(client).toBeInstanceOf(FluentMCPClient);
      expect(StdioClientTransport).toHaveBeenCalled();
    });

    it('should create and connect a client with http transport', async () => {
      const client = await connectMCPClient('TestClient', '1.0.0', {
        type: 'http',
        url: 'http://example.com/mcp'
      });

      expect(client).toBeInstanceOf(FluentMCPClient);
      expect(StreamableHTTPClientTransport).toHaveBeenCalled();
    });

    it('should create and connect a client with sse transport', async () => {
      const client = await connectMCPClient('TestClient', '1.0.0', {
        type: 'sse',
        url: 'http://example.com/sse'
      });

      expect(client).toBeInstanceOf(FluentMCPClient);
      expect(SSEClientTransport).toHaveBeenCalled();
    });

    it('should throw error for unsupported transport type', async () => {
      await expect(connectMCPClient('TestClient', '1.0.0', {
        type: 'unknown' as any
      })).rejects.toThrow('Unsupported transport type: unknown');
    });

    it('should use default empty args for stdio', async () => {
      await connectMCPClient('TestClient', '1.0.0', {
        type: 'stdio',
        command: 'test-command'
      });

      expect(StdioClientTransport).toHaveBeenCalled();
    });

    it('should use default empty options', async () => {
      await connectMCPClient('TestClient', '1.0.0', {
        type: 'http',
        url: 'http://example.com/mcp'
      });

      expect(StreamableHTTPClientTransport).toHaveBeenCalled();
    });
  });
});
