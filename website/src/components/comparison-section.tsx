export function ComparisonSection() {
  const features = [
    {
      feature: "Setup Complexity",
      mcpServers: "Individual server implementations required",
      mcpServlets: "Single servlet handles multiple agent configurations"
    },
    {
      feature: "State Management",
      mcpServers: "Stateless request/response model",
      mcpServlets: "Persistent workflow state across interactions"
    },
    {
      feature: "Coordination",
      mcpServers: "Manual orchestration between servers",
      mcpServlets: "Built-in boomerang patterns for seamless handoffs"
    },
    {
      feature: "Scalability",
      mcpServers: "One server per specialized function",
      mcpServlets: "Multiple agents from single serverless deployment"
    },
    {
      feature: "Configuration",
      mcpServers: "Separate config for each server",
      mcpServlets: "Unified configuration with agent variants"
    },
    {
      feature: "Deployment",
      mcpServers: "Multiple processes to manage",
      mcpServlets: "Single serverless deployment"
    }
  ]

  return (
    <section className="py-12 px-6 bg-gray-900/50" id="comparison">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-orbitron">
            MCP Servers vs <span className="gradient-text">MCP Servlets</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            Traditional MCP servers vs our innovative servlet approach
          </p>
        </div>

        <div className="overflow-hidden">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-300">Feature</h3>
            </div>
            <div className="bg-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white">Traditional MCP Servers</h3>
            </div>
            <div className="bg-gray-800 p-6">
              <h3 className="text-lg font-semibold text-orange-500">MCP Servlets</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {features.map((item, index) => (
              <div key={index} className="grid md:grid-cols-3 gap-6 p-4 rounded-lg hover:bg-gray-800/30 transition-colors">
                <div className="font-semibold text-white">
                  {item.feature}
                </div>
                <div className="text-gray-400">
                  {item.mcpServers}
                </div>
                <div className="text-gray-300">
                  {item.mcpServlets}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12">
          <div className="brush-steel rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Traditional MCP Servers</h3>
            <p className="text-gray-400 mb-4">
              Standard MCP protocol implementation with individual servers for each specialized function.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• One server per capability</li>
              <li>• Stateless operations</li>
              <li>• Manual coordination required</li>
              <li>• Complex deployment scenarios</li>
            </ul>
          </div>
          
          <div className="brush-steel rounded-xl p-6">
            <h3 className="text-xl font-bold text-orange-600 mb-4">MCP Servlets</h3>
            <p className="text-gray-400 mb-4">
              Revolutionary serverless approach with unified agent management and built-in workflow coordination.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Multiple agents per servlet</li>
              <li>• Persistent state management</li>
              <li>• Automatic workflow coordination</li>
              <li>• Simplified serverless deployment</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}