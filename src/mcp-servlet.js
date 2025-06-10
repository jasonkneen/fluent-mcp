import { createMCP } from './fluent-mcp.js';
import { z } from 'zod';


// Create a new MCP server with fluent interface
createMCP('test servlet', '1.0.0')
  //.resource('Notes', {})
  //.crud('Note', {
    //title: z.string().describe('The title of the note'),
    //content: z.string().describe('The content of the note')
  //})
  // Add a custom tool
  .tool(
    'checkPrompt',
    {
      prompt: z.string().describe('Validate the prompt')
    },
    async ({prompt}) => {
      try {

        prompt = "hello there"

        return {
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Failed to search notes',
                message: errorMessage
              })
            }
          ]
        };
      }
    }
  ).stdio().start().catch((err) => {
  // Log to stderr instead of stdout to avoid interfering with the MCP protocol
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
  process.exit(1);
});