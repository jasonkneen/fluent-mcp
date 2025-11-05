#!/usr/bin/env node

/**
 * FluentMCP SSE Server Example
 *
 * This example demonstrates:
 * 1. Creating an SSE server transport
 * 2. Running multiple transports simultaneously (stdio + SSE)
 * 3. Handling both transports on the same MCP server instance
 */

import express from 'express';
import { createMCP } from '../dist/fluent-mcp.js';

// Create Express application for SSE transport
const app = express();
app.use(express.json());

// Store active transports by session ID
const transports = new Map();

// Create a single MCP server instance with tools
function createServerInstance() {
  return createMCP('Multi-Transport Notes API', '1.0.0')
    .resource('Notes', {})
    .crud('Note', {
      title: createMCP.z.string().describe('The title of the note'),
      content: createMCP.z.string().describe('The content of the note'),
      tags: createMCP.z.array(createMCP.z.string()).optional().describe('Optional tags')
    })
    .tool(
      'searchNotes',
      {
        query: createMCP.z.string().describe('Search query')
      },
      async function({ query }) {
        const notes = Object.values(this.getResource('Notes'));
        const results = notes.filter(note =>
          note.title?.toLowerCase().includes(query.toLowerCase()) ||
          note.content?.toLowerCase().includes(query.toLowerCase())
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              results,
              count: results.length
            }, null, 2)
          }]
        };
      }
    );
}

//=============================================================================
// SSE TRANSPORT ENDPOINT
//=============================================================================

// GET /sse - Establish SSE stream
app.get('/sse', async (req, res) => {
  console.log('[SSE] Client connecting...');

  try {
    // Create a new server instance for this SSE connection
    const server = createServerInstance();

    // Configure SSE transport and start
    // Note: We pass the response object and endpoint for POST messages
    await server.sse('/messages', res).start();

    console.log('[SSE] Client connected successfully');

    // Clean up on disconnect
    res.on('close', () => {
      console.log('[SSE] Client disconnected');
    });

  } catch (error) {
    console.error('[SSE] Connection error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }
});

// POST /messages - Handle incoming messages from SSE clients
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;

  console.log(`[SSE] Received message for session: ${sessionId}`);

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const transport = transports.get(sessionId);

  if (!transport) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    // The transport will handle the message
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('[SSE] Message handling error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to handle message' });
    }
  }
});

//=============================================================================
// STDIO TRANSPORT (runs simultaneously with SSE)
//=============================================================================

// Create stdio server instance that runs in parallel with SSE
const stdioServer = createServerInstance();

// Check if running via stdio (when command is piped)
if (!process.stdin.isTTY) {
  console.error('[STDIO] Starting stdio transport...');

  stdioServer.stdio().start()
    .then(() => {
      console.error('[STDIO] Server started and ready');
    })
    .catch(error => {
      console.error('[STDIO] Failed to start:', error);
      process.exit(1);
    });
}

//=============================================================================
// HTTP SERVER
//=============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  FluentMCP Multi-Transport Server                          ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  SSE Transport:                                            ║
║    URL: http://localhost:${PORT}/sse                           ║
║    POST: http://localhost:${PORT}/messages?sessionId=<id>      ║
║                                                            ║
║  Stdio Transport:                                          ║
║    Available when run via MCP client                       ║
║                                                            ║
║  Both transports share the same MCP server capabilities!   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});
