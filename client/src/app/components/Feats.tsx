import Image from "next/image";

export default function Other() {
  return (
    <div className="relative h-screen flex">
      <div className="w-1/2 flex justify-center items-center">
        <Image
          src="https://source.unsplash.com/400x400/?funny"
          alt="Funny Random"
          width={400}
          height={400}
          className="rounded-lg"
        />
      </div>
      <div className="w-1/2 flex flex-col justify-center items-center text-white text-6xl font-medium max-w-xl leading-tight text-center px-12">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-red-600 to-red-400 opacity-30"
          />
        </div>
        Go Beyond <br />
        Mùsíc 🎸
      </div>
    </div>
  );
}