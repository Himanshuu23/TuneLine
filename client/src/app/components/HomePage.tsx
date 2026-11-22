import Demo from "./Demo"
import Footer from "./Footer"
import Hero from "./Hero"
import Navbar from "./Nav"
import Pricing from "./Pricing"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <Hero />
      <Demo />
      <Pricing />
      <Footer />
    </div>
  )
}
