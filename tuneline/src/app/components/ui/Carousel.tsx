
"use client";

import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useEffect, useState } from "react";

export default function Example() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    if (!api || count === 0) return;

    const interval = setInterval(() => {
      if (current === count) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [api, count, current]);

  return (
    <Carousel setApi={setApi}>
      <CarouselContent>
        <CarouselItem>Item 1</CarouselItem>
        <CarouselItem>Item 2</CarouselItem>
        <CarouselItem>Item 3</CarouselItem>
      </CarouselContent>
      <div>
        Slide {current} of {count}
      </div>
    </Carousel>
  );
}

