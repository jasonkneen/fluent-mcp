import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema, 
  InitializeRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Suppress verbose logging
process.env.DEBUG = process.env.DEBUG || 'error';  // Only show errors by default

// Re-export zod for convenience
export { z };

/**
 * A unified fluent interface for creating MCP servers
 * Provides both simple and advanced usage patterns
 */
export class FluentMCP {
  private server: McpServer;
  private resources: Record<string, Record<string, any>>;
  mcpResources: Map<string, any>; // Made public for testing
  mcpPrompts: Map<string, any>; // Made public for testing
  private toolRegistry: Map<string, any>;
  private negotiatedProtocolVersion: string | null;
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
  constructor(name: string, version = "1.0.0", options: Record<string, any> = {}) {
    this.server = new McpServer({
      name,
      version,
      ...options
    });
    this.resources = {};
    this.mcpResources = new Map(); // Store MCP resources
    this.mcpPrompts = new Map(); // Store MCP prompts
    this.toolRegistry = new Map(); // Store tool info for compatibility processing
    this.negotiatedProtocolVersion = null; // Store negotiated MCP protocol version
    this.options = {
      autoGenerateIds: true,
      timestampEntries: true,
      ...options
    };
    
    // Add Zod schema validation directly on the instance
    this.z = z;
    this.schema = z; // Alternative name for the same functionality
  }

  /**
   * Setup MCP version negotiation and compatibility
   */
  private _setupMcpVersioning() {
    const underlyingServer = (this.server as any).server;
    if (!underlyingServer || !underlyingServer.setRequestHandler) return;

    // Intercept initialize request to capture protocol version
    underlyingServer.setRequestHandler(InitializeRequestSchema, async (request: any) => {
      // Store the client's requested protocol version
      const clientVersion = request.params?.protocolVersion;
      
      // Determine which version to negotiate
      // Support both 2024-11-05 (older) and 2025-03-26 (newer)
      if (clientVersion === '2024-11-05') {
        this.negotiatedProtocolVersion = '2024-11-05';
      } else {
        // Default to newest version (2025-03-26) for any other version or newer
        this.negotiatedProtocolVersion = '2025-03-26';
      }
      
      // Always include tools capability, only add others if we have them
      const capabilities: any = { 
        tools: { listChanged: true }
      };
      
      // Get the original initialize result
      const result = {
        protocolVersion: this.negotiatedProtocolVersion,
        capabilities,
        serverInfo: { name: "FluentMCP", version: "1.0.0" }
      };
      
      return result;
    });
  }

  /**
   * Setup tools list handler that adapts to negotiated MCP version
   * This is called after server connection when handlers are available
   */
  private _setupVersionedToolsList() {
    const underlyingServer = (this.server as any).server;
    if (!underlyingServer || !underlyingServer.setRequestHandler) return;

    underlyingServer.setRequestHandler(ListToolsRequestSchema, async (request: any) => {
      // Default to modern format if no version negotiated yet
      const protocolVersion = this.negotiatedProtocolVersion || '2025-03-26';
      
      const tools = [];
      
      // Build tools list from our registry with improved schema extraction
      for (const [toolName, toolInfo] of this.toolRegistry) {
        // UNIVERSAL FORMAT: Provide BOTH legacy and modern fields with full schemas
        const tool = {
          name: toolName,
          // Legacy format fields (2024-11-05)
          description: (toolInfo as any).description,
          inputSchema: (toolInfo as any).inputSchema,
          // Modern format fields (2025-03-26)
          annotations: {
            description: (toolInfo as any).description,
            ...(toolInfo as any).inputSchema // Spread the full schema into annotations
          }
        };
        
        tools.push(tool);
      }
      
      return { tools };
    });
  }

  /**
   * Add a tool to the server with dual-format compatibility
   */
  tool(name: string, schema: any, handler: Function): this {
    // Extract description and schema info for compatibility
    const toolInfo = this._extractToolInfo(name, schema);
    
    // Store tool info for later processing
    this.toolRegistry.set(name, toolInfo);
    
    // Create a wrapper handler that binds 'this' context
    const boundHandler = async (args: any) => {
      return await handler.call(this, args);
    };
    
    // Register with the MCP SDK (this creates the annotations format)
    (this.server as any).tool(name, schema, boundHandler);
    
    return this;
  }

  /**
   * Extract tool information from Zod schema for compatibility
   */
  private _extractToolInfo(name: string, schema: any) {
    let description = "";
    let inputSchema = { type: "object" };
    
    if (schema && typeof schema === 'object') {
      // If it's a Zod object schema with description
      if (schema._def && schema._def.typeName === 'ZodObject') {
        description = schema._def.description || "";
        inputSchema = this._convertZodToJsonSchema(schema);
      }
      // If it's a plain object with Zod validators
      else if (!schema._def && typeof schema === 'object') {
        inputSchema = this._convertObjectToJsonSchema(schema);
      }
      // For other Zod types
      else if (schema._def) {
        inputSchema = this._convertZodToJsonSchema(schema);
      }
    }
    
    return {
      name,
      description,
      inputSchema
    };
  }

  /**
   * Convert Zod schema to JSON Schema format
   */
  private _convertZodToJsonSchema(zodSchema: any): any {
    if (!zodSchema._def) return { type: "object" };
    
    switch (zodSchema._def.typeName) {
      case 'ZodObject':
        const properties: any = {};
        const required: string[] = [];
        const shape = zodSchema._def.shape();
        
        for (const [key, value] of Object.entries(shape)) {
          properties[key] = this._convertZodToJsonSchema(value);
          if (!this._isOptional(value as any)) {
            required.push(key);
          }
        }
        
        return {
          type: "object",
          properties,
          ...(required.length > 0 && { required }),
          additionalProperties: false
        };
        
      case 'ZodString':
        const stringSchema: any = { type: "string" };
        if (zodSchema._def.description) stringSchema.description = zodSchema._def.description;
        if (zodSchema._def.checks) {
          zodSchema._def.checks.forEach((check: any) => {
            if (check.kind === 'min') stringSchema.minLength = check.value;
            if (check.kind === 'max') stringSchema.maxLength = check.value;
          });
        }
        return stringSchema;
        
      case 'ZodNumber':
        return {
          type: "number",
          ...(zodSchema._def.description && { description: zodSchema._def.description })
        };
        
      case 'ZodBoolean':
        return {
          type: "boolean",
          ...(zodSchema._def.description && { description: zodSchema._def.description })
        };
        
      case 'ZodEnum':
        return {
          type: "string",
          enum: zodSchema._def.values,
          ...(zodSchema._def.description && { description: zodSchema._def.description })
        };
        
      case 'ZodDefault':
        const baseSchema = this._convertZodToJsonSchema(zodSchema._def.innerType);
        return {
          ...baseSchema,
          default: zodSchema._def.defaultValue()
        };
        
      case 'ZodOptional':
        return this._convertZodToJsonSchema(zodSchema._def.innerType);
        
      default:
        return { type: "string" };
    }
  }

  /**
   * Convert object with Zod validators to JSON Schema
   */
  private _convertObjectToJsonSchema(obj: any): any {
    const properties: any = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (value && (value as any)._def) {
        properties[key] = this._convertZodToJsonSchema(value);
        if (!this._isOptional(value as any)) {
          required.push(key);
        }
      }
    }
    
    return {
      type: "object",
      properties,
      ...(required.length > 0 && { required }),
      additionalProperties: false
    };
  }

  /**
   * Check if a Zod schema is optional
   */
  private _isOptional(zodSchema: any): boolean {
    return zodSchema._def.typeName === 'ZodOptional' || 
           (zodSchema._def.typeName === 'ZodDefault');
  }

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
  ): this {
    if (typeof options === 'function') {
      handler = options;
      options = {};
    }
    
    this.mcpResources.set(uri, {
      name: (options as any).name || uri.split('/').pop() || 'Resource',
      description: (options as any).description || `Resource at ${uri}`,
      mimeType: (options as any).mimeType || "text/plain",
      handler
    });
    
    return this;
  }

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
  ): this {
    if (typeof options === 'function') {
      handler = options;
      options = {};
    }
    
    this.mcpPrompts.set(name, {
      description: (options as any).description || `Prompt: ${name}`,
      arguments: (options as any).arguments || [],
      handler
    });
    
    return this;
  }

  /**
   * Initialize a resource store (legacy method for compatibility)
   */
  resource(name: string, initialData: Record<string, any> = {}): this {
    this.resources[name] = initialData;
    return this;
  }

  /**
   * Get a resource store
   */
  getResource(name: string): Record<string, any> {
    return this.resources[name] || {};
  }

  /**
   * Set a resource value
   */
  setResource(name: string, id: string, data: any): this {
    if (!this.resources[name]) {
      this.resources[name] = {};
    }
    
    this.resources[name][id] = data;
    return this;
  }

  /**
   * Delete a resource value
   */
  deleteResource(name: string, id: string): this {
    if (this.resources[name] && this.resources[name][id]) {
      delete this.resources[name][id];
    }
    return this;
  }

  /**
   * Create CRUD operations for a resource
   */
  crud(
    resourceName: string, 
    schema: Record<string, z.ZodType<any>>, 
    options: {
      singularName?: string;
      pluralName?: string;
      generateIds?: boolean;
      timestamps?: boolean;
      [key: string]: any;
    } = {}
  ): this {
    // Merge options with defaults
    const crudOptions = {
      singularName: resourceName,
      pluralName: `${resourceName}s`,
      generateIds: this.options.autoGenerateIds,
      timestamps: this.options.timestampEntries,
      ...options
    };

    // Initialize the resource if it doesn't exist
    if (!this.resources[crudOptions.pluralName]) {
      this.resources[crudOptions.pluralName] = {};
    }

    // Get by ID
    this.tool(
      `get${crudOptions.singularName}`,
      {
        id: z.string().describe(`The ID of the ${crudOptions.singularName.toLowerCase()} to retrieve`)
      },
      async function(this: FluentMCP, { id }: { id: string }) {
        try {
          const item = this.resources[crudOptions.pluralName][id];
          
          if (!item) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `${crudOptions.singularName} not found`,
                    id
                  }, null, 2)
                }
              ]
            };
          }
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: item,
                  id
                }, null, 2)
              }
            ]
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `Failed to retrieve ${crudOptions.singularName.toLowerCase()}`,
                  id
                }, null, 2)
              }
            ]
          };
        }
      }
    );

    // Get all
    this.tool(
      `getAll${crudOptions.pluralName}`,
      {},
      async function(this: FluentMCP) {
        try {
          const items = Object.values(this.resources[crudOptions.pluralName]);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: items,
                  count: items.length
                }, null, 2)
              }
            ]
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `Failed to retrieve ${crudOptions.pluralName.toLowerCase()}`
                }, null, 2)
              }
            ]
          };
        }
      }
    );

    // Create
    this.tool(
      `create${crudOptions.singularName}`,
      schema,
      async function(this: FluentMCP, data: any) {
        try {
          // Generate ID if needed
          const id = crudOptions.generateIds 
            ? Math.random().toString(36).substring(2, 15)
            : data.id;
            
          if (!id) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `ID is required when auto-generation is disabled`
                  }, null, 2)
                }
              ]
            };
          }
          
          // Add timestamps if enabled
          const timestamps = crudOptions.timestamps 
            ? { createdAt: new Date().toISOString() }
            : {};
            
          // Create the item
          this.resources[crudOptions.pluralName][id] = {
            id,
            ...data,
            ...timestamps
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `${crudOptions.singularName} created successfully`,
                  data: this.resources[crudOptions.pluralName][id],
                  id
                }, null, 2)
              }
            ]
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `Failed to create ${crudOptions.singularName.toLowerCase()}`
                }, null, 2)
              }
            ]
          };
        }
      }
    );

    // Update
    this.tool(
      `update${crudOptions.singularName}`,
      {
        id: z.string().describe(`The ID of the ${crudOptions.singularName.toLowerCase()} to update`),
        ...schema
      },
      async function(this: FluentMCP, { id, ...data }: { id: string; [key: string]: any }) {
        try {
          const item = this.resources[crudOptions.pluralName][id];
          
          if (!item) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `${crudOptions.singularName} not found`,
                    id
                  }, null, 2)
                }
              ]
            };
          }

          // Add timestamps if enabled
          const timestamps = crudOptions.timestamps 
            ? { updatedAt: new Date().toISOString() }
            : {};

          this.resources[crudOptions.pluralName][id] = {
            ...item,
            ...data,
            ...timestamps
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `${crudOptions.singularName} updated successfully`,
                  data: this.resources[crudOptions.pluralName][id],
                  id
                }, null, 2)
              }
            ]
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `Failed to update ${crudOptions.singularName.toLowerCase()}`,
                  id
                }, null, 2)
              }
            ]
          };
        }
      }
    );

    // Delete
    this.tool(
      `delete${crudOptions.singularName}`,
      {
        id: z.string().describe(`The ID of the ${crudOptions.singularName.toLowerCase()} to delete`)
      },
      async function(this: FluentMCP, { id }: { id: string }) {
        try {
          const item = this.resources[crudOptions.pluralName][id];
          
          if (!item) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `${crudOptions.singularName} not found`,
                    id
                  }, null, 2)
                }
              ]
            };
          }

          delete this.resources[crudOptions.pluralName][id];
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `${crudOptions.singularName} deleted successfully`,
                  id
                }, null, 2)
              }
            ]
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `Failed to delete ${crudOptions.singularName.toLowerCase()}`,
                  id
                }, null, 2)
              }
            ]
          };
        }
      }
    );

    return this;
  }

  /**
   * Enable stdio transport
   */
  stdio(): this {
    this.transportType = 'stdio';
    return this;
  }

  /**
   * Start the server with the configured transport
   */
  async start(): Promise<this> {
    let transport;
    
    // Use the configured transport or default to stdio
    if (this.transportType === 'stdio' || !this.transportType) {
      transport = new StdioServerTransport();
      
      // Override console methods to prevent output to stdout when using stdio transport
      const originalConsoleLog = console.log;
      const originalConsoleInfo = console.info;
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;
      
      // Only override if we're using stdio transport
      if (process.env.NODE_ENV !== 'test') {
        console.log = function(...args: any[]) {
          originalConsoleError('[LOG]', ...args);
        };
        
        console.info = function(...args: any[]) {
          originalConsoleError('[INFO]', ...args);
        };
        
        console.warn = function(...args: any[]) {
          originalConsoleError('[WARN]', ...args);
        };
        
        // Keep error logging to stderr
        console.error = function(...args: any[]) {
          originalConsoleError('[ERROR]', ...args);
        };
      }
    }
    
    try {
      // Setup version negotiation BEFORE connecting
      this._setupMcpVersioning();
      
      await this.server.connect(transport);
      
      // Setup tools list handler AFTER connection when handlers are available
      this._setupVersionedToolsList();
      
      return this;
    } catch (error) {
      // Ensure any startup errors are properly reported to stderr
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

/**
 * Create a new FluentMCP instance with flexible options
 */
export function createMCP(
  name: string, 
  version?: string, 
  options: Record<string, any> = {}
): FluentMCP {
  return new FluentMCP(name, version, options);
}
