import { createMCP } from './fluent-mcp.js';
import { z } from 'zod';

// Define a Note type for better type safety
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

// Create a new MCP server with fluent interface
const server = createMCP('Notes API', '1.0.0')
  // Define the Note schema
  .resource('Notes', {})
  // Create CRUD operations for Notes
  .crud('Note', {
    title: z.string().describe('The title of the note'),
    content: z.string().describe('The content of the note')
  })
  // Add a custom tool
  .tool(
    'searchNotes',
    {
      query: z.string().describe('The search query')
    },
    async ({ query }: { query: string }) => {
      try {
        // Get all notes from the resources using the accessor method
        const notes = Object.values(server.getResource('Notes')) as Note[];
        
        // Filter notes based on the query
        const results = notes.filter((note) => 
          note.title.toLowerCase().includes(query.toLowerCase()) || 
          note.content.toLowerCase().includes(query.toLowerCase())
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                results,
                count: results.length
              }, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Failed to search notes',
                message: errorMessage
              }, null, 2)
            }
          ]
        };
      }
    }
  )
  // Enable stdio transport
  .stdio();

// Start the server
server.start().then(() => {
  console.log('Server started successfully');
}).catch((err: unknown) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
});