import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
  ListResourcesResultSchema,
  ListPromptsResultSchema,
  GetPromptResultSchema,
  LoggingMessageNotificationSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Re-export zod for convenience
export { z };
export { LoggingMessageNotificationSchema };

/**
 * A unified fluent interface for creating MCP clients
 * Provides both simple and advanced usage patterns
 */
export class FluentMCPClient {
  /**
   * Create a new FluentMCPClient instance
   */
  constructor(name, version = "1.0.0", options = {}) {
    this.client = new Client({
      name,
      version,
      ...options
    });
    
    this.options = {
      ...options
    };
    
    // Add Zod schema validation directly on the instance
    this.z = z;
    this.schema = z; // Alternative name for the same functionality
    
    // Setup error handler
    this.client.onerror = (error) => {
      console.error('MCP Client Error:', error);
    };
    
    // Initialize notification handlers
    this.notificationHandlers = {};
  }

  /**
   * Register an error handler
   */
  onError(handler) {
    this.client.onerror = handler;
    return this;
  }
  
  /**
   * Register a notification handler
   */
  onNotification(notificationSchema, handler) {
    // Store handler in notificationHandlers object as fallback
    this.notificationHandlers[notificationSchema.description || 'notification'] = handler;
    
    // Use setNotificationHandler if available (MCP SDK >= 1.11)
    if (typeof this.client.setNotificationHandler === 'function') {
      this.client.setNotificationHandler(notificationSchema, handler);
    }
    return this;
  }
  
  /**
   * Enable stdio transport
   */
  stdio(command, args = [], options = {}) {
    this.transportType = 'stdio';
    this.transportOptions = {
      command,
      args,
      ...options
    };
    return this;
  }
  
  /**
   * Enable HTTP transport
   */
  http(url, options = {}) {
    this.transportType = 'http';
    this.transportOptions = {
      url,
      ...options
    };
    return this;
  }
  
  /**
   * Call a tool on the MCP server
   */
  async callTool(name, args = {}, resultSchema = CallToolResultSchema) {
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }
    
    try {
      const result = await this.client.callTool({
        name,
        arguments: args
      }, resultSchema);
      
      return result;
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * List available tools on the MCP server
   */
  async listTools() {
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }
    
    try {
      const result = await this.client.request({
        method: 'tools/list',
        params: {}
      }, ListToolsResultSchema);
      return result.tools;
    } catch (error) {
      console.error("Error listing tools:", error);
      throw error;
    }
  }
  
  /**
   * List available resources on the MCP server
   */
  async listResources() {
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }
    
    try {
      const result = await this.client.request({
        method: 'resources/list',
        params: {}
      }, ListResourcesResultSchema);
      return result.resources;
    } catch (error) {
      console.error("Error listing resources:", error);
      throw error;
    }
  }
  
  /**
   * List available prompts on the MCP server
   */
  async listPrompts() {
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }
    
    try {
      const result = await this.client.request({
        method: 'prompts/list',
        params: {}
      }, ListPromptsResultSchema);
      return result.prompts;
    } catch (error) {
      console.error("Error listing prompts:", error);
      throw error;
    }
  }
  
  /**
   * Get a prompt from the MCP server
   */
  async getPrompt(name, args = {}) {
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }
    
    try {
      const result = await this.client.request({
        method: 'prompts/get',
        params: {
          name,
          arguments: args
        }
      }, GetPromptResultSchema);
      return result;
    } catch (error) {
      console.error(`Error getting prompt ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Parse the result content from a tool call
   * Convenience method to extract JSON data from text content
   */
  parseToolResult(result) {
    if (!result || !result.content || !Array.isArray(result.content)) {
      return null;
    }
    
    // Try to find a text content item and parse it as JSON
    for (const item of result.content) {
      if (item.type === 'text' && item.text) {
        try {
          return JSON.parse(item.text);
        } catch (e) {
          return item.text;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Connect to the MCP server using the configured transport
   */
  async connect() {
    let transport;
    
    // Use the configured transport
    if (this.transportType === 'stdio') {
      transport = new StdioClientTransport(this.transportOptions);
    } else if (this.transportType === 'http') {
      transport = new StreamableHTTPClientTransport(
        new URL(this.transportOptions.url),
        this.transportOptions
      );
    } else {
      throw new Error("No transport configured. Use stdio() or http() to configure a transport.");
    }
    
    try {
      // Connect the client using the transport (this will start it automatically)
      await this.client.connect(transport);
      
      // Store the transport
      this.transport = transport;
      
      return this;
    } catch (error) {
      console.error("Failed to connect to MCP server:", error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the MCP server
   */
  async disconnect() {
    if (!this.transport) {
      return this;
    }
    
    try {
      await this.transport.close();
      this.transport = null;
      return this;
    } catch (error) {
      console.error("Error disconnecting from MCP server:", error);
      throw error;
    }
  }
}

/**
 * Create a new FluentMCPClient instance with flexible options
 */
export function createMCPClient(name, version, options = {}) {
  return new FluentMCPClient(name, version, options);
}

/**
 * Helper function to create a client and connect it in one call
 */
export async function connectMCPClient(name, version, transportConfig) {
  const client = new FluentMCPClient(name, version);
  
  if (transportConfig.type === 'stdio') {
    client.stdio(
      transportConfig.command,
      transportConfig.args || [],
      transportConfig.options || {}
    );
  } else if (transportConfig.type === 'http') {
    client.http(
      transportConfig.url,
      transportConfig.options || {}
    );
  } else {
    throw new Error(`Unsupported transport type: ${transportConfig.type}`);
  }
  
  await client.connect();
  return client;
}