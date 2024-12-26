export default function Video() {
  return (
    <div className="relative h-screen mt-16">
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
      <div className="absolute inset-0 flex justify-center items-center">
        <div className="w-full max-w-screen mx-14 mt-10 rounded-xl overflow-hidden shadow-xl">
          <iframe
            width="100%"
            height="550"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="flex justify-center items-center h-full text-white text-4xl font-semibold absolute inset-0 z-10">
        Video to get started for the same
      </div>
    </div>
  );
}
