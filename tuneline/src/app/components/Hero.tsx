import { Button } from "@/components/ui/button";

const TEXT = "Get Started >"

export default function Hero() {
    return (
        <div className="flex h-screen">
            <div className="flex flex-col w-full h-1/2 ml-44 mt-32">
                <h1 className="text-6xl font-medium break-words p-4 max-w-xl w-full">Viewers play what they want</h1>
                <p className="p-5 pb-0 text-lg">The best way to stream what viewers want to some random text.</p>
                <p className="p-5 pt-0 text-lg">The best way to stream what viewers want to something.</p>
                <div>
                    <Button className="m-4 w-1/4 h-1/2 rounded-full text-lg" variant="secondary">{TEXT}</Button> {/* prompt to enter into the input -> some blinking input around the input bar -> focussing on it using transition */}
                    <Button className="m-4 px-4 py-7 h-1/2 text-lg rounded-full w-1/4">Demo</Button> {/* do the screenheight to demo video */}
                </div>
            </div>
            <div className="w-1/2 h-full mr-44 mt-32">
                Queue Picture
            </div>
        </div>
    )
}