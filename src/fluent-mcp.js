import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Re-export zod for convenience
export { z };

/**
 * A unified fluent interface for creating MCP servers
 * Provides both simple and advanced usage patterns
 */
export class FluentMCP {
  /**
   * Create a new FluentMCP instance
   */
  constructor(name, version = "1.0.0", options = {}) {
    this.server = new McpServer({
      name,
      version,
      ...options
    });
    this.resources = {};
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
   * Add a tool to the server
   */
  tool(name, schema, handler) {
    this.server.tool(name, schema, handler);
    return this;
  }

  /**
   * Initialize a resource store
   */
  resource(name, initialData = {}) {
    this.resources[name] = initialData;
    return this;
  }

  /**
   * Get a resource store
   */
  getResource(name) {
    return this.resources[name] || {};
  }

  /**
   * Set a resource value
   */
  setResource(name, id, data) {
    if (!this.resources[name]) {
      this.resources[name] = {};
    }
    
    this.resources[name][id] = data;
    return this;
  }

  /**
   * Delete a resource value
   */
  deleteResource(name, id) {
    if (this.resources[name] && this.resources[name][id]) {
      delete this.resources[name][id];
    }
    return this;
  }

  /**
   * Create CRUD operations for a resource
   */
  crud(resourceName, schema, options = {}) {
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
      async ({ id }) => {
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
      async () => {
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
      async (data) => {
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
      async ({ id, ...data }) => {
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
      async ({ id }) => {
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
  stdio() {
    this.transportType = 'stdio';
    return this;
  }

  /**
   * Start the server with the configured transport
   */
  async start() {
    let transport;
    
    // Use the configured transport or default to stdio
    if (this.transportType === 'stdio' || !this.transportType) {
      transport = new StdioServerTransport();
    }
    
    await this.server.connect(transport);
    return this;
  }
}

/**
 * Create a new FluentMCP instance with simple defaults
 */
export function createMCP(name, version, options = {}) {
  return new FluentMCP(name, version, options);
}

/**
 * Create a new FluentMCP instance with advanced options
 */
export function createAdvancedMCP(name, version, options = {}) {
  return new FluentMCP(name, version, {
    autoGenerateIds: false,
    timestampEntries: false,
    ...options
  });
}