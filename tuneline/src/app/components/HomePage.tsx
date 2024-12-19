import Footer from "./Footer"
import Hero from "./Hero"
import Navbar from "./Nav"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <Hero />
      <div>
        Video to get started for the same
      </div>
      <Footer />
    </div>
  )
}
