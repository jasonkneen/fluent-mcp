import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { ExamplesSection } from '@/components/examples-section'
import { ComparisonSection } from '@/components/comparison-section'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ExamplesSection />
      <ComparisonSection />
      <Footer />
    </main>
  )
}