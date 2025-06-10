import { Repeat, ArrowRightLeft, Workflow } from 'lucide-react'

export function ExamplesSection() {
  const examples = [
    {
      title: "Boomerang Task Delegation",
      description: "Delegate complex tasks across AI systems with automatic return handling",
      icon: Repeat,
      code: `{
  "mcpServers": {
    "boomerang-delegator": {
      "command": "node",
      "args": ["boomerang-servlet.js"],
      "env": {
        "AGENT_TYPE": "delegator"
      }
    }
  }
}`
    },
    {
      title: "Cross-Platform Workflow",
      description: "Coordinate workflows between ROO Code, Cursor, and other MCP clients",
      icon: ArrowRightLeft,
      code: `{
  "mcpServers": {
    "cross-platform-coordinator": {
      "command": "node",
      "args": ["workflow-servlet.js"],
      "env": {
        "WORKFLOW_TYPE": "cross_platform",
        "SUPPORTED_CLIENTS": "roo,cursor,copilot"
      }
    }
  }
}`
    },
    {
      title: "Multi-Agent Coordination",
      description: "Deploy multiple specialized agents from a single servlet configuration",
      icon: Workflow,
      code: `{
  "mcpServers": {
    "multi-agent-servlet": {
      "command": "node",
      "args": ["multi-agent-servlet.js"],
      "env": {
        "AGENTS": "researcher,writer,reviewer",
        "COORDINATION_MODE": "sequential"
      }
    }
  }
}`
    }
  ];

  const boomerangComparison = [
    {
      feature: "Task Delegation",
      rooBoomerang: "Internal mode switching within ROO",
      mcpBoomerang: "Cross-system task delegation"
    },
    {
      feature: "Platform Support",
      rooBoomerang: "ROO Code only",
      mcpBoomerang: "Universal MCP compatibility"
    },
    {
      feature: "State Persistence",
      rooBoomerang: "Session-based context",
      mcpBoomerang: "Workflow-persistent state"
    },
    {
      feature: "Return Handling",
      rooBoomerang: "Automatic mode return",
      mcpBoomerang: "Structured result aggregation"
    },
    {
      feature: "Error Recovery",
      rooBoomerang: "Mode-level retry",
      mcpBoomerang: "Systematic workflow rollback"
    }
  ];

  return (
    <section className="py-12 px-6 bg-gray-900/30" id="examples">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-orbitron">
            Boomerang <span className="gradient-text">Examples</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            See how MCP servlets enable powerful boomerang patterns for workflow coordination
          </p>
        </div>
        
        <div className="space-y-12">
          {examples.map((example, index) => (
            <div 
              key={index}
              className="grid lg:grid-cols-2 gap-8 items-start"
            >
              <div className={`space-y-4 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <example.icon className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-white">
                    {example.title}
                  </h3>
                </div>
                <p className="text-base text-gray-400 leading-relaxed">
                  {example.description}
                </p>
              </div>
              
              <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="brush-steel rounded-xl p-6 border border-gray-600">
                  <pre className="text-sm font-mono text-gray-300 overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 font-orbitron">
              ROO Boomerang vs <span className="gradient-text">MCP Boomerang</span>
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Both enable task delegation, but MCP boomerang patterns work across any platform
            </p>
          </div>

          <div className="brush-steel rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-px bg-gray-700">
              <div className="bg-gray-800 p-6">
                <h4 className="text-lg font-semibold text-white">Feature</h4>
              </div>
              <div className="bg-gray-800 p-6">
                <h4 className="text-lg font-semibold text-orange-500">ROO Boomerang</h4>
              </div>
              <div className="bg-gray-800 p-6">
                <h4 className="text-lg font-semibold text-orange-600">MCP Boomerang</h4>
              </div>
            </div>
            
            {boomerangComparison.map((row, index) => (
              <div key={index} className="grid grid-cols-3 gap-px bg-gray-700">
                <div className="bg-gray-900/50 p-4">
                  <span className="text-gray-300 font-medium">{row.feature}</span>
                </div>
                <div className="bg-gray-900/50 p-4">
                  <span className="text-gray-400">{row.rooBoomerang}</span>
                </div>
                <div className="bg-gray-900/50 p-4">
                  <span className="text-gray-400">{row.mcpBoomerang}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="brush-steel rounded-xl p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">ROO Boomerang Tasks</h4>
              <p className="text-gray-400 mb-4">
                Perfect for internal workflow delegation within ROO Code's ecosystem. 
                Seamlessly breaks down complex tasks into specialized mode operations.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Native ROO Code integration</li>
                <li>• Automatic mode detection</li>
                <li>• Context-aware delegation</li>
                <li>• Built-in result aggregation</li>
              </ul>
            </div>
            
            <div className="brush-steel rounded-xl p-6">
              <h4 className="text-xl font-bold text-orange-600 mb-4">MCP Boomerang Servlets</h4>
              <p className="text-gray-400 mb-4">
                Universal workflow orchestration across any MCP-compatible platform. 
                Enables systematic coordination between different AI systems and external services.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Platform-agnostic design</li>
                <li>• Cross-system coordination</li>
                <li>• Persistent workflow state</li>
                <li>• Standardized delegation patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}