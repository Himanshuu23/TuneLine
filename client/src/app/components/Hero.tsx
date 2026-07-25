import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
    return (
      <div id="hero" className="relative flex mx-4 h-screen pt-16">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#1e9b5b] to-[#00b94f] opacity-30"
          />
        </div>
        <div className="flex flex-col w-full h-full pt-32 pl-12 pr-12 relative z-10">
          <h1 className="text-6xl font-medium break-words p-6 max-w-xl w-full">
            Viewers play what they love
          </h1>
          <p className="p-5 pb-0 my-2 text-lg font-medium break-words max-w-xl text-gray-300">
            Stream live or watch your favorite creator. <br />
            Queue in your favorite videos and let the fun begin!
          </p>
          <div>
            <Button className="m-4 px-6 py-3 h-12 rounded-full text-lg" variant="secondary">
              Get Started &gt;
            </Button>
            <Link href="#demo" className="m-4 px-12 py-3 h-12 bg-[#1e9b5b] text-lg text-white rounded-full w-1/5 opacity-80 hover:opacity-100">
              Demo &gt;
            </Link>
          </div>
        </div>
        <div className="w-1/2 h-full mr-12 mt-32 relative z-10">Queue Picture</div>
      </div>
    );
  }  