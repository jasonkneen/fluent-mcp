import { Terminal, Play, Settings } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-12 flex items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight font-orbitron">
              <span className="gradient-text">MCP</span>{' '}
              <span className="text-white">Servlets</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 font-light">
              Orchestrate AI workflows across any platform
            </p>
          </div>
          
          <p className="text-base text-gray-400 max-w-xl leading-relaxed">
            Platform-agnostic MCP server framework that works with ROO Code, Amp, Copilot, 
            Klein, and any MCP-compatible AI system. Create reusable workflow patterns with 
            persistent state and structured coordination.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="brush-steel glow-border px-8 py-4 rounded-lg font-semibold text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              Get Started
            </button>
            <button className="border border-gray-600 px-8 py-4 rounded-lg font-semibold text-gray-300 hover:text-white hover:border-gray-400 transition-all duration-300">
              View Docs
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div className="brush-steel rounded-2xl p-6 border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-red-400" />
              <Play className="w-4 h-4 text-yellow-400" />
              <Settings className="w-4 h-4 text-green-400" />
              <span className="ml-4 text-gray-400 text-sm font-mono">mcp_settings.json</span>
            </div>
            <pre className="text-sm font-mono text-gray-300 overflow-x-auto">
              <code>{`{
  "mcpServers": {
    "my-servlet": {
      "command": "node",
      "args": ["servlet.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}