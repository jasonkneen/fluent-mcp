import { createMCPClient } from './fluent-mcp-client.js';
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

async function main() {
  try {
    // Create a new MCP client with fluent interface using HTTP transport
    const client = createMCPClient('Notes HTTP Client', '1.0.0')
      // Register notification handler
      .onNotification(LoggingMessageNotificationSchema, (notification: any) => {
        console.log(`Server notification: ${notification.params.level} - ${notification.params.data}`);
      })
      // Configure HTTP connection (assuming example server running on port 3000)
      .http('http://localhost:3000/mcp');
    
    // Connect to the server
    console.log('Connecting to MCP server via HTTP...');
    await client.connect();
    console.log('Connected to MCP server');
    
    // List available tools
    console.log('Available tools:');
    const tools = await client.listTools();
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
    // Call the searchNotes tool
    console.log('\nSearching for notes with "example"...');
    const searchResult = await client.callTool('searchNotes', { query: 'example' });
    console.log('Search results:');
    searchResult.content.forEach((item: any) => {
      if (item.type === 'text') {
        const data = JSON.parse(item.text);
        console.log(`Found ${data.count} results:`);
        if (data.results) {
          data.results.forEach((note: any) => {
            console.log(`- ${note.title}: ${note.content}`);
          });
        }
      }
    });
    
    // Disconnect from the server
    console.log('\nDisconnecting from MCP server...');
    await client.disconnect();
    console.log('Disconnected from MCP server');
    
  } catch (err) {
    console.error('Error in client example:', err);
  }
}

// Run the example
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});