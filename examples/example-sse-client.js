#!/usr/bin/env node

/**
 * FluentMCP SSE Client Example
 *
 * This example demonstrates:
 * 1. Connecting to an SSE MCP server
 * 2. Calling tools over SSE transport
 * 3. Handling notifications
 */

import { createMCPClient } from '../dist/fluent-mcp-client.js';

async function main() {
  console.log('FluentMCP SSE Client Example');
  console.log('============================\n');

  // Get server URL from command line or use default
  const serverUrl = process.argv[2] || 'http://localhost:3000/sse';

  console.log(`Connecting to SSE server at: ${serverUrl}\n`);

  try {
    // Create and connect SSE client
    const client = createMCPClient('SSE Notes Client', '1.0.0')
      .sse(serverUrl)
      .onError((error) => {
        console.error('Client error:', error);
      });

    await client.connect();
    console.log('✓ Connected to MCP server via SSE\n');

    // List available tools
    console.log('=== Available Tools ===');
    const tools = await client.listTools();
    tools.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description || 'No description'}`);
    });
    console.log();

    // Create a note
    console.log('=== Creating a Note ===');
    const createResult = await client.callTool('createNote', {
      title: 'SSE Test Note',
      content: 'This note was created via SSE transport!',
      tags: ['sse', 'test', 'example']
    });

    const createData = client.parseToolResult(createResult);
    console.log('Created note:', createData);
    console.log();

    // Get all notes
    console.log('=== Getting All Notes ===');
    const allNotesResult = await client.callTool('getAllNotes', {});
    const allNotes = client.parseToolResult(allNotesResult);
    console.log('All notes:', allNotes);
    console.log();

    // Search notes
    console.log('=== Searching Notes ===');
    const searchResult = await client.callTool('searchNotes', {
      query: 'SSE'
    });
    const searchData = client.parseToolResult(searchResult);
    console.log('Search results:', searchData);
    console.log();

    // Update the note
    if (createData.id) {
      console.log('=== Updating Note ===');
      const updateResult = await client.callTool('updateNote', {
        id: createData.id,
        title: 'Updated SSE Note',
        content: 'This note was updated via SSE transport!',
        tags: ['sse', 'updated']
      });
      const updateData = client.parseToolResult(updateResult);
      console.log('Updated note:', updateData);
      console.log();
    }

    // Delete the note
    if (createData.id) {
      console.log('=== Deleting Note ===');
      const deleteResult = await client.callTool('deleteNote', {
        id: createData.id
      });
      const deleteData = client.parseToolResult(deleteResult);
      console.log('Delete result:', deleteData);
      console.log();
    }

    // Disconnect
    console.log('=== Disconnecting ===');
    await client.disconnect();
    console.log('✓ Disconnected from server');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
