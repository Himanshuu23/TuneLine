import { Button } from "@/components/ui/button";

const TEXT1 = "Get Started >"
const TEXT2 = "Demo >"

export default function Hero() {
    return (
        <div className="flex h-screen">
            <div className="flex flex-col w-full h-1/2 ml-44 mt-32">
                <h1 className="text-6xl font-medium break-words p-6 max-w-xl w-full">Viewers play what they want</h1>
                <p className="p-5 pb-0 my-2 text-lg font-medium break-words max-w-xl text-gray-300">The best way to stream what viewers want to some random text. The best way to stream what viewers want to something.</p>
                <div>
                    <Button className="m-4 px-6 h-1/2 rounded-full text-lg" variant="secondary">{TEXT1}</Button> {/* prompt to enter into the input -> some blinking input around the input bar -> focussing on it using transition */}
                    <Button className="m-4 px-4 py-7 h-1/2 text-lg text-gray-300 rounded-full w-1/4">{TEXT2}</Button> {/* do the screenheight to demo video */}
                </div>
            </div>
            <div className="w-1/2 h-full mr-44 mt-32">
                Queue Picture
            </div>
        </div>
    )
}