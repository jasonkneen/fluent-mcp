import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export { LoggingMessageNotificationSchema };

/**
 * FluentMCPClient class provides a chainable interface for creating MCP clients
 */
export class FluentMCPClient {
  private client: Client;
  private options: Record<string, any>;
  private transportType?: string;
  private transportOptions?: Record<string, any>;
  private transport?: StdioClientTransport | StreamableHTTPClientTransport;
  private notificationHandlers: Record<string, Function>;
  
  // Zod schema validation accessible directly on the instance
  z: typeof z;
  schema: typeof z;

  /**
   * Create a new FluentMCPClient instance
   */
  constructor(name: string, version?: string, options?: Record<string, any>);

  /**
   * Register an error handler
   */
  onError(handler: (error: Error) => void): this;
  
  /**
   * Register a notification handler
   */
  onNotification(notificationSchema: z.ZodType<any>, handler: Function): this;
  
  /**
   * Enable stdio transport
   */
  stdio(command: string, args?: string[], options?: Record<string, any>): this;
  
  /**
   * Enable HTTP transport
   */
  http(url: string, options?: Record<string, any>): this;
  
  /**
   * Call a tool on the MCP server
   */
  callTool<T = any>(name: string, args?: Record<string, any>, resultSchema?: z.ZodType<any>): Promise<T>;
  
  /**
   * List available tools on the MCP server
   */
  listTools(): Promise<Array<{name: string, description: string, schema: any}>>;
  
  /**
   * List available resources on the MCP server
   */
  listResources(): Promise<Array<{name: string, uri: string}>>;
  
  /**
   * List available prompts on the MCP server
   */
  listPrompts(): Promise<Array<{name: string, description: string}>>;
  
  /**
   * Get a prompt from the MCP server
   */
  getPrompt(name: string, args?: Record<string, any>): Promise<{messages: Array<{role: string, content: {text: string}}>}>;
  
  /**
   * List available roots (if client supports root exposure)
   */
  listRoots(): Promise<Array<{uri: string, name?: string}>>;  
  
  /**
   * Parse the result content from a tool call
   * Convenience method to extract JSON data from text content
   */
  parseToolResult(result: any): any;
  
  /**
   * Connect to the MCP server using the configured transport
   */
  connect(): Promise<this>;
  
  /**
   * Disconnect from the MCP server
   */
  disconnect(): Promise<this>;
}

/**
 * Create a new FluentMCPClient instance with flexible options
 * 
 * @param name - The name of the MCP client
 * @param version - The version of the MCP client (default: "1.0.0")
 * @param options - Configuration options for the client
 */
export function createMCPClient(
  name: string, 
  version?: string, 
  options?: Record<string, any>
): FluentMCPClient;

/**
 * Helper function to create a client and connect it in one call
 */
export function connectMCPClient(
  name: string,
  version?: string,
  transportConfig: {
    type: 'stdio' | 'http',
    command?: string,
    args?: string[],
    url?: string,
    options?: Record<string, any>
  }
): Promise<FluentMCPClient>;