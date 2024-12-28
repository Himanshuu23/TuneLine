import { Button } from "@/components/ui/button";

const TEXT1 = "Get Started >"
const TEXT2 = "Demo >"

export default function Hero() {
    return (
        <div className="relative flex mx-4 h-screen pt-16">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff80b5] to-[#9089fc] blur-3xl opacity-50"></div>
            <div className="flex flex-col w-full h-full pt-32 pl-12 pr-12 relative z-10">
                <h1 className="text-6xl font-medium break-words p-6 max-w-xl w-full">Viewers play what they want to</h1>
                <p className="p-5 pb-0 my-2 text-lg font-medium break-words max-w-xl text-gray-300">The best way to stream what viewers want to some random text. The best way to stream what viewers want to something.</p>
                <div>
                    <Button className="m-4 px-6 py-3 h-12 rounded-full text-lg" variant="secondary">{TEXT1}</Button>
                    <Button className="m-4 px-4 py-3 h-12 text-lg text-gray-300 rounded-full w-1/4">{TEXT2}</Button>
                </div>
            </div>
            <div className="w-1/2 h-full mr-12 mt-32 relative z-10">
                Queue Picture
            </div>
        </div>
    )
}
