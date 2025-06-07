import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * FluentMCP class provides a chainable interface for creating MCP servers
 */
export class FluentMCP {
  private server: McpServer;
  private resources: Record<string, Record<string, any>>;
  mcpResources: Map<string, any>; // Made public for testing
  mcpPrompts: Map<string, any>; // Made public for testing
  private options: {
    autoGenerateIds: boolean;
    timestampEntries: boolean;
    [key: string]: any;
  };
  private transportType?: string;
  
  // Zod schema validation accessible directly on the instance
  z: typeof z;
  schema: typeof z;

  /**
   * Create a new FluentMCP instance
   */
  constructor(name: string, version?: string, options?: Record<string, any>);

  /**
   * Add a tool to the server
   */
  tool(name: string, schema: any, handler: Function): this;

  /**
   * Register an MCP resource
   */
  addResource(
    uri: string, 
    options: { 
      name?: string; 
      description?: string; 
      mimeType?: string; 
    } | Function, 
    handler?: Function
  ): this;

  /**
   * Register an MCP prompt
   */
  addPrompt(
    name: string, 
    options: { 
      description?: string; 
      arguments?: Array<{ name: string; description: string; required?: boolean }>; 
    } | Function, 
    handler?: Function
  ): this;

  /**
   * Initialize a resource store (legacy method for compatibility)
   */
  resource(name: string, initialData?: Record<string, any>): this;

  /**
   * Get a resource store
   */
  getResource(name: string): Record<string, any>;

  /**
   * Set a resource value
   */
  setResource(name: string, id: string, data: any): this;

  /**
   * Delete a resource value
   */
  deleteResource(name: string, id: string): this;

  /**
   * Create CRUD operations for a resource
   */
  crud(
    resourceName: string, 
    schema: Record<string, z.ZodType<any>>, 
    options?: {
      singularName?: string;
      pluralName?: string;
      generateIds?: boolean;
      timestamps?: boolean;
      [key: string]: any;
    }
  ): this;

  /**
   * Enable stdio transport
   */
  stdio(): this;

  /**
   * Start the server with the configured transport
   */
  start(): Promise<this>;
}

/**
 * Create a new FluentMCP instance with flexible options
 * 
 * @param name - The name of the MCP server
 * @param version - The version of the MCP server (default: "1.0.0")
 * @param options - Configuration options including:
 *   - autoGenerateIds: boolean (default: true) - Whether to auto-generate IDs for CRUD operations
 *   - timestampEntries: boolean (default: true) - Whether to add timestamps to entries
 *   - Any other custom options
 */
export function createMCP(
  name: string, 
  version?: string, 
  options?: Record<string, any>
): FluentMCP;