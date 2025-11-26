#!/usr/bin/env node

/**
 * Database Servlet - In-memory database MCP server
 *
 * This servlet provides a simple in-memory key-value and document
 * database with collections, queries, and basic aggregations.
 * Perfect for prototyping and testing.
 *
 * Usage:
 *   node database-servlet.js
 *
 * Tools provided:
 *   - createCollection: Create a new collection
 *   - insert: Insert document(s) into a collection
 *   - find: Query documents with filters
 *   - update: Update documents matching a filter
 *   - delete: Delete documents matching a filter
 *   - aggregate: Simple aggregation operations
 *   - listCollections: List all collections
 */

import { createMCP } from '../../dist/fluent-mcp.js';
import { z } from 'zod';

// In-memory database storage
const database = new Map();

// Generate unique ID
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// Simple query matcher
function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, value] of Object.entries(filter)) {
    const docValue = doc[key];

    // Handle special operators
    if (typeof value === 'object' && value !== null) {
      if (value.$gt !== undefined && !(docValue > value.$gt)) return false;
      if (value.$gte !== undefined && !(docValue >= value.$gte)) return false;
      if (value.$lt !== undefined && !(docValue < value.$lt)) return false;
      if (value.$lte !== undefined && !(docValue <= value.$lte)) return false;
      if (value.$ne !== undefined && docValue === value.$ne) return false;
      if (value.$in !== undefined && !value.$in.includes(docValue)) return false;
      if (value.$contains !== undefined && !String(docValue).includes(value.$contains)) return false;
    } else if (docValue !== value) {
      return false;
    }
  }

  return true;
}

createMCP('database-servlet', '1.0.0')
  // Create a new collection
  .tool(
    'createCollection',
    {
      name: z.string().describe('Collection name'),
      schema: z.record(z.string()).optional().describe('Optional schema definition'),
    },
    async ({ name, schema }) => {
      if (database.has(name)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Collection "${name}" already exists`,
            }, null, 2)
          }]
        };
      }

      database.set(name, {
        documents: new Map(),
        schema,
        createdAt: new Date().toISOString(),
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Collection "${name}" created`,
            schema: schema || null,
          }, null, 2)
        }]
      };
    }
  )

  // Insert documents
  .tool(
    'insert',
    {
      collection: z.string().describe('Collection name'),
      documents: z.array(z.record(z.any())).describe('Array of documents to insert'),
    },
    async ({ collection, documents }) => {
      if (!database.has(collection)) {
        // Auto-create collection if it doesn't exist
        database.set(collection, {
          documents: new Map(),
          createdAt: new Date().toISOString(),
        });
      }

      const col = database.get(collection);
      const insertedIds = [];

      for (const doc of documents) {
        const id = doc._id || generateId();
        const fullDoc = {
          _id: id,
          ...doc,
          _createdAt: new Date().toISOString(),
        };
        col.documents.set(id, fullDoc);
        insertedIds.push(id);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            insertedCount: insertedIds.length,
            insertedIds,
          }, null, 2)
        }]
      };
    }
  )

  // Find documents
  .tool(
    'find',
    {
      collection: z.string().describe('Collection name'),
      filter: z.record(z.any()).optional().describe('Query filter (e.g., {age: {$gt: 18}})'),
      limit: z.number().optional().describe('Maximum documents to return'),
      skip: z.number().optional().describe('Number of documents to skip'),
      sort: z.record(z.number()).optional().describe('Sort order ({field: 1} for asc, {field: -1} for desc)'),
    },
    async ({ collection, filter, limit, skip = 0, sort }) => {
      if (!database.has(collection)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Collection "${collection}" not found`,
            }, null, 2)
          }]
        };
      }

      const col = database.get(collection);
      let results = Array.from(col.documents.values())
        .filter(doc => matchesFilter(doc, filter));

      // Apply sorting
      if (sort) {
        const [sortField, sortOrder] = Object.entries(sort)[0];
        results.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      }

      // Apply pagination
      if (skip > 0) {
        results = results.slice(skip);
      }
      if (limit) {
        results = results.slice(0, limit);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: results.length,
            documents: results,
          }, null, 2)
        }]
      };
    }
  )

  // Update documents
  .tool(
    'update',
    {
      collection: z.string().describe('Collection name'),
      filter: z.record(z.any()).describe('Query filter to match documents'),
      update: z.record(z.any()).describe('Update operations'),
      multi: z.boolean().optional().describe('Update multiple documents (default: false)'),
    },
    async ({ collection, filter, update, multi = false }) => {
      if (!database.has(collection)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Collection "${collection}" not found`,
            }, null, 2)
          }]
        };
      }

      const col = database.get(collection);
      let modifiedCount = 0;

      for (const [id, doc] of col.documents) {
        if (matchesFilter(doc, filter)) {
          const updatedDoc = {
            ...doc,
            ...update,
            _updatedAt: new Date().toISOString(),
          };
          col.documents.set(id, updatedDoc);
          modifiedCount++;

          if (!multi) break;
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            matchedCount: modifiedCount,
            modifiedCount,
          }, null, 2)
        }]
      };
    }
  )

  // Delete documents
  .tool(
    'delete',
    {
      collection: z.string().describe('Collection name'),
      filter: z.record(z.any()).describe('Query filter to match documents'),
      multi: z.boolean().optional().describe('Delete multiple documents (default: false)'),
    },
    async ({ collection, filter, multi = false }) => {
      if (!database.has(collection)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Collection "${collection}" not found`,
            }, null, 2)
          }]
        };
      }

      const col = database.get(collection);
      let deletedCount = 0;
      const toDelete = [];

      for (const [id, doc] of col.documents) {
        if (matchesFilter(doc, filter)) {
          toDelete.push(id);
          if (!multi) break;
        }
      }

      for (const id of toDelete) {
        col.documents.delete(id);
        deletedCount++;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            deletedCount,
          }, null, 2)
        }]
      };
    }
  )

  // Aggregate
  .tool(
    'aggregate',
    {
      collection: z.string().describe('Collection name'),
      operation: z.enum(['count', 'sum', 'avg', 'min', 'max', 'group'])
        .describe('Aggregation operation'),
      field: z.string().optional().describe('Field to aggregate'),
      groupBy: z.string().optional().describe('Field to group by (for group operation)'),
      filter: z.record(z.any()).optional().describe('Filter documents before aggregating'),
    },
    async ({ collection, operation, field, groupBy, filter }) => {
      if (!database.has(collection)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Collection "${collection}" not found`,
            }, null, 2)
          }]
        };
      }

      const col = database.get(collection);
      const docs = Array.from(col.documents.values())
        .filter(doc => matchesFilter(doc, filter));

      let result;

      switch (operation) {
        case 'count':
          result = { count: docs.length };
          break;

        case 'sum':
          if (!field) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Field required for sum' }, null, 2)
              }]
            };
          }
          result = { sum: docs.reduce((acc, doc) => acc + (Number(doc[field]) || 0), 0) };
          break;

        case 'avg':
          if (!field) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Field required for avg' }, null, 2)
              }]
            };
          }
          const sum = docs.reduce((acc, doc) => acc + (Number(doc[field]) || 0), 0);
          result = { avg: docs.length > 0 ? sum / docs.length : 0 };
          break;

        case 'min':
          if (!field) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Field required for min' }, null, 2)
              }]
            };
          }
          result = { min: Math.min(...docs.map(doc => Number(doc[field]) || Infinity)) };
          break;

        case 'max':
          if (!field) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Field required for max' }, null, 2)
              }]
            };
          }
          result = { max: Math.max(...docs.map(doc => Number(doc[field]) || -Infinity)) };
          break;

        case 'group':
          if (!groupBy) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ success: false, error: 'groupBy field required' }, null, 2)
              }]
            };
          }
          const groups = {};
          for (const doc of docs) {
            const key = String(doc[groupBy] ?? 'null');
            if (!groups[key]) groups[key] = [];
            groups[key].push(doc);
          }
          result = {
            groups: Object.entries(groups).map(([key, items]) => ({
              _id: key,
              count: items.length,
              items: field ? items.map(i => i[field]) : undefined,
            }))
          };
          break;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, ...result }, null, 2)
        }]
      };
    }
  )

  // List collections
  .tool(
    'listCollections',
    {},
    async () => {
      const collections = [];

      for (const [name, col] of database) {
        collections.push({
          name,
          documentCount: col.documents.size,
          createdAt: col.createdAt,
          hasSchema: !!col.schema,
        });
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: collections.length,
            collections,
          }, null, 2)
        }]
      };
    }
  )

  .stdio()
  .start()
  .catch((err) => {
    console.error('Database servlet failed to start:', err);
    process.exit(1);
  });
