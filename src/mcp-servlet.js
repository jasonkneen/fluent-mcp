import { createMCP } from '../dist/fluent-mcp.js';
import { z } from 'zod';

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

  return {
    instruction: instructionArg || 'The Role and Definition of this Agent, it\'s abilities, tooling, and capailities',
    prompt: promptArg || 'The request to the agent',
    context: contextArg || 'Relevant context for the agent',
    hasInstruction: !!instructionArg,
    hasPrompt: !!promptArg,
    hasContext: !!contextArg
  };
}

const { instruction: dynamicInstruction, prompt: defaultPrompt, context: defaultContext, hasInstruction, hasPrompt, hasContext } = parseArgs();

createMCP('servlet server', '1.0.0')
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
              text: `${hasInstruction ? dynamicInstruction : instruction}\n\nContext: ${hasContext ? defaultContext : context}\n\nPrompt: ${hasPrompt ? defaultPrompt : prompt}`
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
  ).stdio().start().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
  process.exit(1);
});