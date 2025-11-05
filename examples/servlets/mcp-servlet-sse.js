#!/usr/bin/env node

/**
 * MCP Servlet with SSE Transport
 *
 * This servlet demonstrates how to create an MCP server with SSE (Server-Sent Events) transport
 * Usage: node mcp-servlet-sse.js --instruction "Your agent role" --prompt "Default prompt" --context "Context"
 */

import express from 'express';
import { createMCP } from '../../dist/fluent-mcp.js';
import { z } from 'zod';
import os from 'os';

function parseArgs() {
  const args = process.argv.slice(2);

  const getArgValue = (argName) => {
    const argIndex = args.indexOf(`--${argName}`);
    if (argIndex !== -1 && args[argIndex + 1]) {
      return args[argIndex + 1];
    }
    return null;
  };

  const instructionArg = getArgValue('instruction');
  const promptArg = getArgValue('prompt');
  const contextArg = getArgValue('context');
  const portArg = getArgValue('port');

  return {
    instruction: instructionArg || 'The Role and Definition of this Agent, its abilities, tooling, and capabilities',
    prompt: promptArg || 'The request to the agent',
    context: contextArg || 'Relevant context for the agent',
    port: portArg || '3000',
    hasInstruction: !!instructionArg,
    hasPrompt: !!promptArg,
    hasContext: !!contextArg
  };
}

const {
  instruction: dynamicInstruction,
  prompt: defaultPrompt,
  context: defaultContext,
  port,
  hasInstruction,
  hasPrompt,
  hasContext
} = parseArgs();

// Create Express app
const app = express();
app.use(express.json());

// Store active sessions
const sessions = new Map();

// Create server instance factory
function createServerInstance() {
  return createMCP('servlet server', '1.0.0')
    .tool(
      'call_agent_with_prompt_and_context',
      {
        instruction: z.string().describe(dynamicInstruction),
        prompt: z.string().describe(defaultPrompt),
        context: z.string().describe(defaultContext),
      },
      async ({instruction, prompt, context}) => {
        try {
          return {
            content: [
              {
                type: 'text',
                text: `task(${hasInstruction ? dynamicInstruction : instruction}, ${hasContext ? defaultContext : context}, ${hasPrompt ? defaultPrompt : prompt})`
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
                  error: 'Failed to process request',
                  message: errorMessage
                })
              }
            ]
          };
        }
      }
    );
}

// SSE endpoint - establishes the event stream
app.get('/sse', async (req, res) => {
  console.log('[SSE] Client connecting...');

  try {
    const server = createServerInstance();

    // Start SSE transport
    await server.sse('/messages', res).start();

    console.log('[SSE] Client connected');

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

// POST endpoint for messages
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;

  console.log(`[POST] Message for session: ${sessionId}`);

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId parameter' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    // The transport will handle the message
    await session.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('[POST] Message handling error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to handle message' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    transport: 'sse',
    instruction: dynamicInstruction,
    prompt: defaultPrompt,
    context: defaultContext
  });
});

// Start server
const PORT = parseInt(port);
app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  for (const iface of Object.values(networkInterfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push(`http://${addr.address}:${PORT}`);
      }
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  MCP Servlet Server (SSE Transport)                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Local:    http://localhost:${PORT}                            ║`);

  addresses.forEach(addr => {
    console.log(`║  Network:  ${addr.padEnd(48)} ║`);
  });

  console.log(`║                                                            ║
║  Endpoints:                                                ║
║    SSE Stream:  GET  /sse                                  ║
║    Messages:    POST /messages?sessionId=<id>              ║
║    Health:      GET  /health                               ║
║                                                            ║
║  Configuration:                                            ║
║    Instruction: ${dynamicInstruction.substring(0, 42).padEnd(42)} ║
║    Prompt:      ${defaultPrompt.substring(0, 42).padEnd(42)} ║
║    Context:     ${defaultContext.substring(0, 42).padEnd(42)} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  process.exit(0);
});
