import { createMCP, createAdvancedMCP } from './fluent-mcp.js';
import { z } from 'zod';

// Test the basic functionality of the fluent MCP interface
console.log('Testing FluentMCP implementation...');

// Create a test server
const server = createMCP('Test API', '1.0.0');

// Test resource creation
server.resource('TestItems', {
  item1: { id: 'item1', name: 'Test Item 1' }
});

// Test resource retrieval
const items = server.getResource('TestItems');
console.log('Resource retrieval test:', 
  items.item1.name === 'Test Item 1' ? 'PASSED' : 'FAILED'
);

// Test resource setting
server.setResource('TestItems', 'item2', { id: 'item2', name: 'Test Item 2' });
const updatedItems = server.getResource('TestItems');
console.log('Resource setting test:', 
  updatedItems.item2.name === 'Test Item 2' ? 'PASSED' : 'FAILED'
);

// Test resource deletion
server.deleteResource('TestItems', 'item1');
const afterDeleteItems = server.getResource('TestItems');
console.log('Resource deletion test:', 
  !afterDeleteItems.item1 && afterDeleteItems.item2 ? 'PASSED' : 'FAILED'
);

// Test CRUD operations
let crudTestPassed = true;

// Capture the tool registrations
const registeredTools = [];

// Create a wrapper for the tool method that captures tool registrations
const originalToolMethod = server.tool.bind(server);
server.tool = function(name, schema, handler) {
  registeredTools.push(name);
  return originalToolMethod(name, schema, handler);
};

// Register CRUD operations
server.crud('Item', {
  name: z.string(),
  description: z.string().optional()
});

// Check if all CRUD operations were registered
const expectedTools = ['getItem', 'getAllItems', 'createItem', 'updateItem', 'deleteItem'];
const allToolsRegistered = expectedTools.every(tool => registeredTools.includes(tool));
console.log('CRUD operations test:', allToolsRegistered ? 'PASSED' : 'FAILED');

// Test advanced options
const advancedServer = createAdvancedMCP('Advanced API', '1.0.0', {
  autoGenerateIds: false,
  customOption: 'test'
});

// Check if options were properly set
console.log('Advanced options test:', 
  !advancedServer.options.autoGenerateIds && 
  advancedServer.options.customOption === 'test' ? 'PASSED' : 'FAILED'
);

// Test the .z property
const isZodString = server.z.string().constructor.name === 'ZodString';
console.log('Z property test:', isZodString ? 'PASSED' : 'FAILED');

// Test the .schema property
const isSchemaString = server.schema.string().constructor.name === 'ZodString';
console.log('Schema property test:', isSchemaString ? 'PASSED' : 'FAILED');

// Test schema validation with .z
const emailSchema = server.z.string().email();
const validEmail = emailSchema.safeParse('test@example.com').success;
const invalidEmail = !emailSchema.safeParse('not-an-email').success;
console.log('Z schema validation test:', 
  validEmail && invalidEmail ? 'PASSED' : 'FAILED'
);

console.log('All tests completed!');