import { createMCP } from '../dist/fluent-mcp.js';
import { z } from 'zod';

createMCP('boomerang-task', '1.0.0')
  .tool(
    'before_request',
    {
      task_id: z.string().describe('Unique identifier for this task'),
      user_prompt: z.string().describe('The original user request'),
      context: z.string().optional().describe('Additional context for the task')
    },
    async ({ task_id, user_prompt, context }) => {
      const timestamp = new Date().toISOString();
      const log_entry = {
        task_id,
        user_prompt,
        context: context || '',
        timestamp,
        phase: 'before_request',
        status: 'initiated'
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Task ${task_id} initiated at ${timestamp}`,
              data: log_entry
            })
          }
        ]
      };
    }
  )
  .tool(
    'after_request',
    {
      task_id: z.string().describe('Unique identifier for this task'),
      result: z.string().describe('The result or outcome of the task'),
      success: z.boolean().describe('Whether the task completed successfully'),
      duration_ms: z.number().optional().describe('Task duration in milliseconds')
    },
    async ({ task_id, result, success, duration_ms }) => {
      const timestamp = new Date().toISOString();
      const log_entry = {
        task_id,
        result,
        success,
        duration_ms: duration_ms || 0,
        timestamp,
        phase: 'after_request',
        status: 'completed'
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Task ${task_id} completed at ${timestamp}`,
              data: log_entry,
              boomerang_complete: true
            })
          }
        ]
      };
    }
  )
  .tool(
    'execute_boomerang_task',
    {
      user_prompt: z.string().describe('The task to execute'),
      pre_request_mcp_server: z.string().describe('MCP server to call before'),
      pre_request_tool: z.string().describe('Tool to call before'),
      post_request_mcp_server: z.string().describe('MCP server to call after'),
      post_request_tool: z.string().describe('Tool to call after'),
      context: z.string().optional().describe('Additional context')
    },
    async ({ user_prompt, pre_request_mcp_server, pre_request_tool, post_request_mcp_server, post_request_tool, context }) => {
      const task_id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const start_time = Date.now();

      try {
        const workflow = {
          task_id,
          user_prompt,
          pre_request: {
            server: pre_request_mcp_server,
            tool: pre_request_tool
          },
          post_request: {
            server: post_request_mcp_server,
            tool: post_request_tool
          },
          context: context || '',
          created_at: new Date().toISOString()
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Boomerang task ${task_id} workflow configured`,
                workflow,
                instructions: {
                  step1: `Call tool '${pre_request_tool}' on server '${pre_request_mcp_server}' with task_id: ${task_id}`,
                  step2: "Execute your main task",
                  step3: `Call tool '${post_request_tool}' on server '${post_request_mcp_server}' with task_id: ${task_id} and results`
                }
              })
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Failed to configure boomerang task',
                message: error.message
              })
            }
          ]
        };
      }
    }
  )
  .stdio()
  .start()
  .catch((err) => {
    console.error('Failed to start boomerang server:', err instanceof Error ? err.message : err);
    process.exit(1);
  });