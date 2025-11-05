#!/usr/bin/env node

/**
 * MCP Servlet with BOTH Stdio AND SSE Transport
 *
 * This servlet runs BOTH transports simultaneously:
 * - Stdio: For CLI/Claude Desktop usage
 * - SSE: For web/HTTP clients
 *
 * Usage: node mcp-servlet-multi.js --instruction "Your agent role" --prompt "Default prompt" --context "Context"
 */

import express from 'express';
import { createMCP } from '../../dist/fluent-mcp.js';
import { z } from 'zod';
import os from 'os';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

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

// Create Express app for SSE transport
const app = express();
app.use(express.json());

// Store active SSE transports by session ID
const sseTransports = new Map();

// Create server instance factory (shared by both transports)
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
                text: `task(${hasInstruction ? dynamicInstruction : instruction}, ${hasContext ? defaultContext : context}, ${hasPrompt ? defaultPrompt : prompt}. format your response in a blue table)`
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

//=============================================================================
// SSE TRANSPORT
//=============================================================================

app.get('/sse', async (req, res) => {
  console.error('[SSE] Client connecting...');

  try {
    // Create SSE transport
    const transport = new SSEServerTransport('/messages', res);
    sseTransports.set(transport.sessionId, transport);

    console.error(`[SSE] Session created: ${transport.sessionId}`);

    // Clean up on disconnect
    res.on('close', () => {
      console.error(`[SSE] Client disconnected: ${transport.sessionId}`);
      sseTransports.delete(transport.sessionId);
    });

    // Create MCP server with tool
    const mcpServer = new McpServer({ name: 'servlet server', version: '1.0.0' });

    // Register the tool
    mcpServer.tool(
      'call_agent_with_prompt_and_context',
      dynamicInstruction,
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
                text: `task(${hasInstruction ? dynamicInstruction : instruction}, ${hasContext ? defaultContext : context}, ${hasPrompt ? defaultPrompt : prompt} and format the response as a blue table in html or markdown)`
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

    // Connect server to transport
    await mcpServer.connect(transport);
    console.error('[SSE] Client connected successfully');

  } catch (error) {
    console.error('[SSE] Connection error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  console.error(`[POST] Message for session: ${sessionId}`);

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId parameter' });
  }

  const transport = sseTransports.get(sessionId);

  if (!transport) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('[POST] Message handling error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to handle message' });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    transports: ['stdio', 'sse'],
    instruction: dynamicInstruction,
    prompt: defaultPrompt,
    context: defaultContext
  });
});

//=============================================================================
// STDIO TRANSPORT (runs in parallel with SSE)
//=============================================================================

// Only start stdio if running from command line (not TTY)
if (!process.stdin.isTTY) {
  console.error('[STDIO] Starting stdio transport...');

  createServerInstance()
    .stdio()
    .start()
    .then(() => {
      console.error('[STDIO] Server started and ready');
    })
    .catch((err) => {
      console.error('[STDIO] Failed to start:', err);
      process.exit(1);
    });
}

//=============================================================================
// HTTP SERVER (for SSE)
//=============================================================================

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

  console.error(`
╔════════════════════════════════════════════════════════════╗
║  MCP Servlet Server (MULTI-TRANSPORT)                      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🔌 STDIO Transport:   ${!process.stdin.isTTY ? 'ACTIVE' : 'INACTIVE (TTY detected)'.padEnd(36)} ║
║  🌐 SSE Transport:     ACTIVE                              ║
║                                                            ║
║  Local:    http://localhost:${PORT}                            ║`);

  addresses.forEach(addr => {
    console.error(`║  Network:  ${addr.padEnd(48)} ║`);
  });

  console.error(`║                                                            ║
║  Endpoints:                                                ║
║    SSE Stream:  GET  /sse                                  ║
║    Health:      GET  /health                               ║
║                                                            ║
║  Configuration:                                            ║
║    Instruction: ${dynamicInstruction.substring(0, 42).padEnd(42)} ║
║    Prompt:      ${defaultPrompt.substring(0, 42).padEnd(42)} ║
║    Context:     ${defaultContext.substring(0, 42).padEnd(42)} ║
║                                                            ║
║  🎯 Both transports share the same MCP tools!              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('\n\nShutting down server...');
  process.exit(0);
});
