import { Globe, Database, RefreshCw, Settings, BarChart3, Link } from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      title: "Platform Agnostic",
      description: "Works with ROO Code, Amp, Copilot, Klein, and any MCP-compatible AI system",
      icon: Globe
    },
    {
      title: "Persistent State",
      description: "Maintain workflow context and data across task boundaries",
      icon: Database
    },
    {
      title: "Structured Coordination",
      description: "Explicit protocols for handoffs between different MCP servers",
      icon: RefreshCw
    },
    {
      title: "Reusable Patterns",
      description: "Create once, deploy everywhere with standardized workflow templates",
      icon: Settings
    },
    {
      title: "Audit Trails",
      description: "Complete visibility into workflow execution and task progression",
      icon: BarChart3
    },
    {
      title: "Cross-System Integration",
      description: "Orchestrate workflows spanning multiple external systems and APIs",
      icon: Link
    }
  ]

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-orbitron">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Built for modern AI development with enterprise-grade reliability and flexibility
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="brush-steel rounded-xl p-6 hover:glow-border transition-all duration-300 group"
            >
              <feature.icon className="w-8 h-8 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-orange-500 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}