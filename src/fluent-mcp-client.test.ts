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
  
  // Factory function tests
  describe('factory functions', () => {
    it('createMCPClient should return a FluentMCPClient instance', () => {
      const client = createMCPClient('TestClient', '1.0.0');
      expect(client).toBeInstanceOf(FluentMCPClient);
    });
  });
});