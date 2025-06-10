import { Menu, Github } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-orbitron">
              <span className="gradient-text">MCP</span>{' '}
              <span className="text-white">Servlets</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#examples" className="text-gray-300 hover:text-white transition-colors">
              Examples
            </a>
            <a href="#comparison" className="text-gray-300 hover:text-white transition-colors">
              Comparison
            </a>
            <a href="/docs" className="text-gray-300 hover:text-white transition-colors">
              Docs
            </a>
            <a href="https://github.com" className="text-gray-300 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="/docs" className="brush-steel glow-border px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-gray-800 transition-all duration-300">
              Get Started
            </a>
          </nav>
          
          <button className="md:hidden text-white" title="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  )
}