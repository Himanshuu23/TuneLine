import Footer from "./Footer"
import Navbar from "./Nav"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="flex">
        <div>
            Viewers play songs
        </div>
        <div>
            Queue Picture
        </div>
      </div>
      <div>
        Video to get started for the same
      </div>
      <Footer />
    </div>
  )
}
