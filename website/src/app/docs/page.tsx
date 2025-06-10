import { Code, Settings, Users, Zap } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 font-orbitron">
              <span className="gradient-text">Documentation</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Learn how to configure and deploy MCP servlets for powerful AI workflow orchestration
            </p>
          </div>

          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-white font-orbitron">Basic Configuration</h2>
              </div>
              
              <div className="brush-steel rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Single Agent Configuration</h3>
                <p className="text-gray-400 mb-4">
                  Configure a basic MCP servlet with a single agent capability:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`{
  "mcpServers": {
    "my-agent": {
      "command": "node",
      "args": ["servlet.js"],
      "env": {
        "AGENT_TYPE": "general",
        "CAPABILITIES": "code,analysis,documentation"
      }
    }
  }
}`}</code>
                </pre>
              </div>

              <div className="brush-steel rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Servlet Implementation</h3>
                <p className="text-gray-400 mb-4">
                  Create your servlet.js file with the MCP protocol implementation:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`import { createMCP } from 'fluent-mcp'

const agentType = process.env.AGENT_TYPE || 'general'
const capabilities = process.env.CAPABILITIES?.split(',') || ['general']

createMCP('my-agent', '1.0.0')
  .tool('process_task', {
    task: z.string(),
    context: z.string().optional()
  }, async ({ task, context }) => {
    // Process based on agent type and capabilities
    return {
      content: [{
        type: 'text',
        text: \`Processed: \${task} with \${agentType} agent\`
      }]
    }
  })
  .stdio()
  .start()`}</code>
                </pre>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-white font-orbitron">Multiple Agents</h2>
              </div>
              
              <div className="brush-steel rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Multi-Agent Configuration</h3>
                <p className="text-gray-400 mb-4">
                  Deploy multiple specialized agents from a single servlet:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`{
  "mcpServers": {
    "code-agent": {
      "command": "node",
      "args": ["servlet.js"],
      "env": {
        "AGENT_TYPE": "coder",
        "SPECIALIZATION": "typescript,react,node"
      }
    },
    "research-agent": {
      "command": "node", 
      "args": ["servlet.js"],
      "env": {
        "AGENT_TYPE": "researcher",
        "SPECIALIZATION": "web_search,analysis,documentation"
      }
    },
    "review-agent": {
      "command": "node",
      "args": ["servlet.js"], 
      "env": {
        "AGENT_TYPE": "reviewer",
        "SPECIALIZATION": "code_review,quality_assurance"
      }
    }
  }
}`}</code>
                </pre>
              </div>

              <div className="brush-steel rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Dynamic Agent Selection</h3>
                <p className="text-gray-400 mb-4">
                  Use environment variables to create specialized behavior from the same codebase:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`const agentConfigs = {
  coder: {
    tools: ['write_code', 'refactor', 'debug'],
    prompt: 'You are a TypeScript/React expert...'
  },
  researcher: {
    tools: ['web_search', 'analyze_data', 'summarize'],
    prompt: 'You are a research specialist...'
  },
  reviewer: {
    tools: ['review_code', 'suggest_improvements'],
    prompt: 'You are a code review expert...'
  }
}

const config = agentConfigs[process.env.AGENT_TYPE] || agentConfigs.coder`}</code>
                </pre>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-white font-orbitron">Boomerang Patterns</h2>
              </div>
              
              <div className="brush-steel rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cross-Platform Delegation</h3>
                <p className="text-gray-400 mb-4">
                  Configure boomerang task delegation between different MCP clients:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`{
  "mcpServers": {
    "boomerang-delegator": {
      "command": "node",
      "args": ["boomerang-servlet.js"],
      "env": {
        "DELEGATION_MODE": "cross_platform",
        "TARGET_SYSTEMS": "roo,cursor,copilot",
        "STATE_PERSISTENCE": "enabled"
      }
    }
  }
}`}</code>
                </pre>
              </div>

              <div className="brush-steel rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Workflow State Management</h3>
                <p className="text-gray-400 mb-4">
                  Implement persistent state across boomerang task boundaries:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`createMCP('boomerang-servlet', '1.0.0')
  .tool('delegate_task', {
    task: z.string(),
    target_system: z.string(),
    return_to: z.string().optional()
  }, async ({ task, target_system, return_to }) => {
    // Store delegation state
    const taskId = await storeTaskState({
      originalTask: task,
      targetSystem: target_system,
      returnTo: return_to || 'origin',
      timestamp: Date.now()
    })
    
    // Delegate to target system
    const result = await delegateToSystem(target_system, task, taskId)
    
    return {
      content: [{
        type: 'text', 
        text: \`Task delegated with ID: \${taskId}\`
      }],
      taskId
    }
  })`}</code>
                </pre>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <Code className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-white font-orbitron">Generic Agent Pattern</h2>
              </div>
              
              <div className="brush-steel rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Universal Servlet Configuration</h3>
                <p className="text-gray-400 mb-4">
                  Create a single servlet that can be configured for any agent type:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`{
  "mcpServers": {
    "universal-agent": {
      "command": "node",
      "args": ["universal-servlet.js"],
      "env": {
        "CONFIG_FILE": "./agent-configs/my-config.json",
        "AGENT_NAME": "CustomAgent",
        "TOOLS": "custom_tool1,custom_tool2,custom_tool3"
      }
    }
  }
}`}</code>
                </pre>
                
                <p className="text-gray-400 mt-4 mb-4">
                  With a corresponding configuration file:
                </p>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">{`// agent-configs/my-config.json
{
  "name": "CustomAgent",
  "version": "1.0.0", 
  "description": "A custom agent for specific workflows",
  "tools": {
    "custom_tool1": {
      "description": "Performs custom operation 1",
      "parameters": {
        "input": "string",
        "options": "object"
      }
    }
  },
  "prompts": {
    "system": "You are a specialized agent that...",
    "user": "Please process the following request..."
  }
}`}</code>
                </pre>
              </div>
            </section>
          </div>

          <div className="mt-16 text-center">
            <div className="brush-steel rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Ready to Get Started?</h3>
              <p className="text-gray-400 mb-6">
                Clone the MCP Servlets repository and start building your own workflow orchestration system.
              </p>
              <a 
                href="https://github.com" 
                className="brush-steel glow-border px-6 py-3 rounded-lg font-semibold text-white hover:bg-gray-800 transition-all duration-300 inline-block"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}